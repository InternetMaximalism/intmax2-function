import semver from "semver";
import { config } from "../config";
import type { BuilderFeeInfoResponse, TokenFee } from "../types";

const allowedTokenIndices = config.BLOCK_BUILDER_ALLOWED_TOKEN_INDICES?.split(",").map((index) =>
  parseInt(index.trim(), 10),
) || [1];

const maxFeeAmount = BigInt(config.BLOCK_BUILDER_MAX_FEE_AMOUNT);

export const validateIndexerInfo = (feeInfo: BuilderFeeInfoResponse) => {
  if (!semver.gte(feeInfo.version, config.BLOCK_BUILDER_REQUIRED_VERSION)) {
    throw new Error(
      `Version ${feeInfo.version} is below required ${config.BLOCK_BUILDER_REQUIRED_VERSION}`,
    );
  }

  const feeValidation = validateFeeInfo(feeInfo);
  if (!feeValidation.isValid) {
    throw new Error(feeValidation.message);
  }
};

const validateFeeArray = (fees: TokenFee[], feeType: string) => {
  for (const fee of fees) {
    if (!allowedTokenIndices.includes(fee.token_index)) {
      return {
        isValid: false,
        message: `Invalid token_index ${fee.token_index} in ${feeType}. Allowed indices: ${allowedTokenIndices.join(", ")}`,
      };
    }

    const feeAmount = BigInt(fee.amount);
    if (feeAmount > maxFeeAmount) {
      return {
        isValid: false,
        message: `Fee amount ${fee.amount} exceeds maximum ${maxFeeAmount.toString()} for token_index ${fee.token_index} in ${feeType}`,
      };
    }
  }
  return { isValid: true };
};

const validateFeeInfo = (feeInfo: BuilderFeeInfoResponse) => {
  const registrationFeeCheck = validateFeeArray(feeInfo.registrationFee, "registrationFee");
  if (!registrationFeeCheck.isValid) {
    return registrationFeeCheck;
  }

  const nonRegistrationFeeCheck = validateFeeArray(
    feeInfo.nonRegistrationFee,
    "nonRegistrationFee",
  );
  if (!nonRegistrationFeeCheck.isValid) {
    return nonRegistrationFeeCheck;
  }

  /*
  if (feeInfo.registrationCollateralFee) {
    const collateralFeeCheck = validateFeeArray(
      feeInfo.registrationCollateralFee,
      "registrationCollateralFee",
    );
    if (!collateralFeeCheck.isValid) {
      return collateralFeeCheck;
    }
  }

  if (feeInfo.nonRegistrationCollateralFee) {
    const nonCollateralFeeCheck = validateFeeArray(
      feeInfo.nonRegistrationCollateralFee,
      "nonRegistrationCollateralFee",
    );
    if (!nonCollateralFeeCheck.isValid) {
      return nonCollateralFeeCheck;
    }
  }
  */

  return { isValid: true };
};
