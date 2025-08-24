import { Block, ethers, FeeData } from "ethers";
import type { PublicClient } from "viem";
import { config } from "../config";

const PRECISION = 10n;

const calculateAdjustedGasPrices = (multiplier: number, feeData: FeeData) => {
  const multiplierScaled = BigInt(Math.round(multiplier * Number(PRECISION)));

  const gasPrice = (feeData.gasPrice! * multiplierScaled) / PRECISION;
  const maxFeePerGas = (feeData.maxFeePerGas! * multiplierScaled) / PRECISION;
  const maxPriorityFeePerGas = (feeData.maxPriorityFeePerGas! * multiplierScaled) / PRECISION;

  return {
    gasPrice,
    maxFeePerGas,
    maxPriorityFeePerGas,
  };
};

const calculateScrollAdjustedGasPrices = (multiplier: number, baseGasPrice: bigint) => {
  const multiplierScaled = BigInt(Math.round(multiplier * Number(PRECISION)));

  const gasPrice = (baseGasPrice * multiplierScaled) / PRECISION;

  return {
    gasPrice,
  };
};

export const getEthersScrollMaxGasMultiplier = async (
  publicClient: PublicClient,
  multiplier: number,
) => {
  const provider = new ethers.JsonRpcProvider(publicClient.transport.transports[0].value.url);

  const [block, feeData] = await Promise.all([provider.getBlock("latest"), provider.getFeeData()]);
  const baseGasPrice = getGasPrice(block, feeData);

  const { gasPrice } = calculateScrollAdjustedGasPrices(multiplier, baseGasPrice);

  return { gasPrice };
};

const getGasPrice = (block: Block | null, feeData: FeeData) => {
  const baseFee = block?.baseFeePerGas ?? 0n;
  const gasPrice = feeData.gasPrice ?? 0n;
  const baseGasPrice = baseFee > gasPrice ? baseFee : gasPrice;

  const multiplierGasPrice = calculateScrollAdjustedGasPrices(
    config.SCROLL_GAS_MULTIPLIER,
    baseGasPrice,
  );
  return multiplierGasPrice.gasPrice + (feeData?.maxPriorityFeePerGas ?? 0n);
};

export const getEthersMaxGasMultiplier = async (publicClient: PublicClient, multiplier: number) => {
  const provider = new ethers.JsonRpcProvider(publicClient.transport.transports[0].value.url);
  const feeData = await provider.getFeeData();
  const { gasPrice, maxFeePerGas, maxPriorityFeePerGas } = calculateAdjustedGasPrices(
    multiplier,
    feeData,
  );

  return { gasPrice, maxFeePerGas, maxPriorityFeePerGas };
};

export const calculateEthersIncreasedGasPrice = (
  previousGasPrice: bigint,
  currentGasPrice: bigint,
) => {
  const newGasPrice = previousGasPrice > currentGasPrice ? previousGasPrice + 1n : currentGasPrice;

  return {
    newGasPrice,
  };
};
