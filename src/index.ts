import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";

import typeDefs from "./schema/typeDefs";
import resolvers from "./schema/resolvers";
import { context, Context } from "./context";

const server = new ApolloServer<Context>({
  typeDefs,
  resolvers,
});

const { url } = await startStandaloneServer<Context>(server, {
  listen: { port: 4000 },
  context,
});

console.log(`Server started at: ${url}`);
