const typeDefs = `#graphql
  type Repository {
    name: String
    size: Int
    owner: String
  }

  type RepositoryDetails  {
    name: String
    size: Int
    owner: String
    accessLevel: String
    numberOfFiles: String
    ymlFile: String
    activeWebhooks: [Webhook]
  }

  type Webhook {
    id: ID
    name: String
    active: Boolean
    config: WebhookConfig
    updated_at: String
    created_at: String
    url: String
  }

  type WebhookConfig {
    url: String
    content_type: String
    insecure_ssl: String
  }


  type Query {
    getRepositories(token: String!): [Repository]
    getRepositoryDetails(token: String!, owner: String!, repository: String!): RepositoryDetails
  }
`;

export default typeDefs;
