import { IResolvers } from "@graphql-tools/utils";

import {
  getRepositories,
  getRepositoryDetails,
  getNumberOfFiles,
  getYmlFileContent,
  getActiveWebhooks,
} from "../utils/github";
import semaphore from "../utils/semaphore";
import {
  GET_REPOSITORY_DETAILS,
  NUMBER_OF_FILES,
  YML_FILE,
  ACTIVE_WEBHOOKS,
} from "../constants";

const resolvers: IResolvers = {
  Query: {
    getRepositories: (_, { token }: { token: string }) =>
      getRepositories(token),
    [GET_REPOSITORY_DETAILS]: async (
      _,
      {
        token,
        owner,
        repository,
      }: { token: string; owner: string; repository: string }
    ) => {
      await semaphore.acquire();
      const params = {
        token,
        owner,
        repository,
      };
      const repositoryDetails = await getRepositoryDetails(params);
      return {
        ...repositoryDetails,
        params,
      };
    },
  },
  RepositoryDetails: {
    [NUMBER_OF_FILES]: (parent) => getNumberOfFiles(parent.params),
    [YML_FILE]: (parent) => getYmlFileContent(parent.params),
    [ACTIVE_WEBHOOKS]: (parent) => getActiveWebhooks(parent.params),
  },
};

export default resolvers;
