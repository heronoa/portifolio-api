/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
import cron from "node-cron";
import { DebtModel } from "./mongoose/mongodb";
import { updateDebtValueByLateFee } from "./utils/debtDbCalcs";

const DAILY_CRON_SCHEDULE = "0 0 9 * * *"; // Todo dia as (9:00)

export async function cronJobs() {
  try {
    cron.schedule(DAILY_CRON_SCHEDULE, async () => {
      const allDebts = await DebtModel.find();
      const lateDebts = allDebts.filter(debt => {
        const currentDueDate =
          debt.due_dates?.[debt.callings] ||
          debt.due_dates[debt.due_dates.length - 1];
        if (!currentDueDate) {
          console.log({
            result: false,
            msg: "Chegou na ultima data programada",
          });
        }
        if (currentDueDate?.getTime() < Date.now() && debt.value > debt.payed)
          return true;
      });

      await updateDebtValueByLateFee(lateDebts);
    });
  } catch (error) {
    console.error("An error occurred:", error);
  }
}
