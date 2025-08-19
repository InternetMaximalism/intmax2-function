import { config } from "@intmax2-function/shared";

export const getProxyMeta = async () => {
  return {
    targetNetwork: config.BUILDER_TARGET_NETWORK,
    version: config.BLOCK_BUILDER_VERSION,
    domain: config.PROXY_DOMAIN,
    token: config.PROXY_FRP_TOKEN,
    minVersion: config.BLOCK_BUILDER_REQUIRED_VERSION,
    maxFee: config.BLOCK_BUILDER_MAX_FEE_AMOUNT,
  };
};
