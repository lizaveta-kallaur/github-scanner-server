import { IResolvers } from "@graphql-tools/utils";

import {
  getRepositories,
  getRepositoryDetails,
  getNumberOfFiles,
  getYmlFileContent,
  getActiveWebhooks,
} from "../utils/github";
import { Context } from "../context";

const resolvers: IResolvers = {
  Query: {
    getRepositories: (_, { token }: { token: string }) =>
      getRepositories(token),
    getRepositoryDetails: async (
      _,
      {
        token,
        owner,
        repository,
      }: { token: string; owner: string; repository: string },
      context: Context
    ) => {
      context.callsCount++;
      if (context.callsCount > 2) {
        throw new Error("Maximum 2 repositories at a time in parallel allowed");
      }

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
    numberOfFiles: (parent) => getNumberOfFiles(parent.params),
    ymlFile: (parent) => getYmlFileContent(parent.params),
    activeWebhooks: (parent) => getActiveWebhooks(parent.params),
  },
};

export default resolvers;
