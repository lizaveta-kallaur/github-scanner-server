import { ApolloServerPlugin } from "@apollo/server";
import { Kind } from "graphql";

import {
  GET_REPOSITORY_DETAILS,
  NUMBER_OF_FILES,
  YML_FILE,
  ACTIVE_WEBHOOKS,
} from "../constants";
import { Context } from "../context";
import semaphore from "../utils/semaphore";

const semaphorePlugin: ApolloServerPlugin<Context> = {
  async requestDidStart() {
    return {
      async executionDidStart() {
        return {
          willResolveField({ contextValue, info }) {
            if (
              ![
                GET_REPOSITORY_DETAILS,
                NUMBER_OF_FILES,
                YML_FILE,
                ACTIVE_WEBHOOKS,
              ].includes(info.fieldName)
            ) {
              return;
            }

            if (info.fieldName === GET_REPOSITORY_DETAILS) {
              const set = new Set<string>();

              info.fieldNodes[0].selectionSet?.selections.forEach(
                (selection) => {
                  if (
                    selection.kind === Kind.FIELD &&
                    [NUMBER_OF_FILES, YML_FILE, ACTIVE_WEBHOOKS].includes(
                      selection.name.value
                    )
                  ) {
                    set.add(selection.name.value);
                  }
                }
              );

              if (set.size) {
                contextValue.lazyFields.set(info.path.key.toString(), set);
                return;
              }

              return () => {
                semaphore.release();
              };
            }

            return () => {
              if (!info.path.prev?.key) {
                return;
              }

              const set = contextValue.lazyFields.get(
                info.path.prev.key.toString()
              );

              if (!set) {
                return;
              }

              set.delete(info.fieldName);

              if (!set.size) {
                semaphore.release();
              }
            };
          },
        };
      },
    };
  },
};

export default semaphorePlugin;
