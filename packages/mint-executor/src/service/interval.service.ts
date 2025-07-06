import { logger, MINT_AVAILABLE_FROM, type MintEventData } from "@intmax2-function/shared";

interface ShouldExecuteActionParams {
  now: number;
  mintEvent: MintEventData | null;
  intervalWeeks: number;
  actionName: "mint" | "transfer";
}

export const shouldExecuteAction = (params: ShouldExecuteActionParams) => {
  const { now, mintEvent, intervalWeeks, actionName } = params;

  const INTERVAL_WEEKS_MS = intervalWeeks * 7 * 24 * 60 * 60 * 1000;

  if (!mintEvent) {
    const shouldExecute = now >= new Date(MINT_AVAILABLE_FROM).getTime();
    logger.info(
      `No last ${actionName} time found, should execute ${actionName} check: ${shouldExecute}`,
    );
    return shouldExecute;
  }

  const nowDate = new Date(now);
  const lastActionDate = new Date(mintEvent.createdAt.toDate());

  nowDate.setHours(0, 0, 0, 0);
  lastActionDate.setHours(0, 0, 0, 0);

  const targetDate = new Date(lastActionDate.getTime() + INTERVAL_WEEKS_MS);

  return nowDate.getTime() >= targetDate.getTime();
};
