import axios from "axios";

interface Repository {
  name: string;
  size: number;
  private: boolean;
  owner: {
    login: string;
  };
}

const ContentTypes = {
  file: "file",
  dir: "dir",
} as const;

interface RepositoryContent {
  name: string;
  type: (typeof ContentTypes)[keyof typeof ContentTypes];
  url: string;
  download_url: string;
}

interface DetailsParams {
  token: string;
  owner: string;
  repository: string;
}

const GITHUB_API_URL = "https://api.github.com";

export const getRepositories = async (token: string) => {
  try {
    const { data } = await axios.get<Repository[]>(
      `${GITHUB_API_URL}/user/repos`,
      {
        headers: {
          Authorization: `token ${token}`,
        },
      }
    );
    return data.map((repository) => ({
      name: repository.name,
      size: repository.size,
      owner: repository.owner.login,
    }));
  } catch (e) {
    console.error("getRepositories failed:", e);
    return [];
  }
};

export const getRepositoryDetails = async (params: DetailsParams) => {
  try {
    const { token, owner, repository } = params;
    const { data: repositoryDetails } = await axios.get<Repository>(
      `${GITHUB_API_URL}/repos/${owner}/${repository}`,
      {
        headers: {
          Authorization: `token ${token}`,
        },
      }
    );

    return {
      name: repositoryDetails.name,
      size: repositoryDetails.size,
      owner: repositoryDetails.owner.login,
      accessLevel: repositoryDetails.private ? "private" : "public",
    };
  } catch (e) {
    console.error("getRepositoryDetails failed:", e);
    return null;
  }
};

const getRepositoryContents = async ({
  token,
  owner,
  repository,
}: DetailsParams): Promise<RepositoryContent[]> => {
  try {
    const { data: repositoryContents } = await axios.get<RepositoryContent[]>(
      `${GITHUB_API_URL}/repos/${owner}/${repository}/contents`,
      {
        headers: {
          Authorization: `token ${token}`,
        },
      }
    );

    return repositoryContents;
  } catch (e) {
    console.error("getRepositoryContents failed:", e);
    return [];
  }
};

const getContentForDir = async ({
  token,
  dirUrl,
  controller,
}: {
  token: string;
  dirUrl: string;
  controller?: AbortController;
}): Promise<RepositoryContent[]> => {
  const { data: dirContent } = await axios.get<RepositoryContent[]>(dirUrl, {
    headers: {
      Authorization: `token ${token}`,
    },
    signal: controller?.signal,
  });

  return dirContent;
};

export const getNumberOfFiles = async (
  params: DetailsParams
): Promise<number> => {
  const repositoryContents = await getRepositoryContents(params);
  const { token } = params;

  const countFiles = async (files: RepositoryContent[]): Promise<number> => {
    let count = 0;
    const dirUrls: string[] = [];

    for (const file of files) {
      if (file.type === ContentTypes.file) {
        count++;
      } else if (file.type === ContentTypes.dir) {
        dirUrls.push(file.url);
      }
    }

    if (!dirUrls.length) {
      return count;
    }

    const dirCounts: number[] = await Promise.all(
      dirUrls.map(async (dirUrl) => {
        const dirContent = await getContentForDir({ dirUrl, token });
        return countFiles(dirContent);
      })
    );
    count += dirCounts.reduce(
      (acc: number, dirCount: number) => acc + dirCount,
      0
    );

    return count;
  };

  return countFiles(repositoryContents);
};

export const getYmlFileContent = async (
  params: DetailsParams
): Promise<string | null> => {
  const repositoryContents = await getRepositoryContents(params);
  const controller = new AbortController();
  const { token } = params;

  const findFile = async (
    files: RepositoryContent[]
  ): Promise<RepositoryContent> => {
    const dirUrls: string[] = [];

    for (const file of files) {
      if (file.type === ContentTypes.file) {
        if (file.name.endsWith(".yml")) {
          controller.abort();
          return file;
        }
      } else if (file.type === ContentTypes.dir) {
        dirUrls.push(file.url);
      }
    }

    if (!dirUrls.length) {
      throw new Error();
    }

    return Promise.any(
      dirUrls.map(async (dirUrl) => {
        const dirContent = await getContentForDir({
          dirUrl,
          token,
          controller,
        });
        return findFile(dirContent);
      })
    );
  };

  try {
    const file = await findFile(repositoryContents);

    const { data: fileContent } = await axios.get(file.download_url, {
      headers: {
        Authorization: `token ${token}`,
      },
    });
    return fileContent;
  } catch (e) {
    return null;
  }
};

export const getActiveWebhooks = async ({
  token,
  owner,
  repository,
}: DetailsParams): Promise<Record<string, unknown>[]> => {
  try {
    const { data: webhooks } = await axios.get<Record<string, unknown>[]>(
      `${GITHUB_API_URL}/repos/${owner}/${repository}/hooks`,
      {
        headers: {
          Authorization: `token ${token}`,
        },
      }
    );

    return webhooks.filter((webhook: any) => webhook.active);
  } catch (e) {
    console.error("getActiveWebhooks failed:", e);
    return [];
  }
};
