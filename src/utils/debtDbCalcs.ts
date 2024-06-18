import Debt from "../entities/Debt";
import { DebtModel } from "../mongoose/mongodb";
import { UpdateOrCreate } from "../mongoose/utils";
import { mailToLateDebts } from "./messager";
import { dataMaisProximaHoje, timestampFromNow } from "./time";

export async function atualizarValorPelaMulta(): Promise<void> {
  try {
    const hoje: Date = new Date();

    const result = await DebtModel.updateMany(
      { date: { $lt: hoje } },
      { $set: { value: { $sum: ["$value", "$fee"] } } },
    );

    console.log(`${result.modifiedCount} entradas foram atualizadas.`);
  } catch (error) {
    console.error("Erro ao atualizar entradas:", error);
  }
}

export async function atualizarValorPelaTaxa() {
  try {
    const hoje: Date = new Date();

    const result = await DebtModel.updateMany(
      { date: { $lt: hoje } },
      { $mul: { value: { $add: ["$value", { $add: [1, "$fee"] }] } } },
    );

    console.log(`${result.modifiedCount} entradas foram atualizadas.`);
  } catch (error) {
    console.error("Erro ao atualizar entradas:", error);
  }
}

function getDaysLate(
  dataInicial: Date,
  dataFinal = new Date(Date.now()),
): number {
  const umDiaEmMilissegundos = 1000 * 60 * 60 * 24;
  const diferencaEmMilissegundos = dataFinal.getTime() - dataInicial.getTime();

  return Math.floor(diferencaEmMilissegundos / umDiaEmMilissegundos);
}

export async function updateDebtValueByLateFee(debts: Debt[]): Promise<{
  result: boolean;
  msg: string;
}> {
  const log = [];

  try {
    for (const debt of debts) {
      const newDoc = JSON.parse(JSON.stringify(debt));

      const novoPrazo = calculateNewDueDates(debt);

      const novoDebt = calculateNewDebt(debt);

      if (
        novoDebt.value !== newDoc.value ||
        new Date(
          [...(novoPrazo.due_dates as unknown as any[])].pop(),
        ).getTime() !== new Date([...newDoc.due_dates].pop()).getTime()
      ) {
        newDoc.value = novoDebt.value;
        newDoc.due_dates = novoPrazo.due_dates;

        try {
          console.log({
            newDoc,
          });

          const res = await UpdateOrCreate(
            DebtModel,
            { debt_id: newDoc.debt_id },
            newDoc,
          );
          if (newDoc.email === "heron.amaral@gmail.com")
            await mailToLateDebts([newDoc]);
          log.push(res);
        } catch (err) {
          console.log({
            result: false,
            msg: "debt calculation error",
            details: err,
          });
          log.push({
            result: false,
            msg: "debt calculation error",
            details: err,
          });
        }
      } else {
        console.log({
          result: true,
          msg: "late fee already up to date",
        });
      }
    }
  } catch (error) {
    console.error("Erro ao atualizar entradas:", error);
    log.push({ result: false, msg: String(error) });
  }
  return { result: true, msg: JSON.stringify(log) };
}

const getPeriodInDays = (due_dates: Date[]) => {
  const initialDate = new Date(due_dates[0]);
  const firstDueDate = new Date(due_dates[1]);
  return getDaysLate(initialDate, firstDueDate);
};

const lateFeeFactor = (late_fee: number, timeSince: number): number => {
  return late_fee * timeSince;
};

const dueDateFactor = (
  initialValue: number,
  fee: number,
  timeSince: number,
): number => {
  const feeAdd = 1 + fee;
  const timeSinceAdd = timeSince + 1;

  const pow = Math.pow(feeAdd, timeSinceAdd);

  return initialValue * pow;
};

const getPeriod = (due_dates: Date[]) => {
  const initialDate = new Date(due_dates[1]).getTime();
  const firstDueDate = new Date(due_dates[0]).getTime();
  const dueTimestamp = firstDueDate - initialDate;

  const result = Math.floor((firstDueDate - Date.now()) / dueTimestamp);

  return result;
};

const getSince = (initial_date: Date, period: number) => {
  const initialDate = new Date(initial_date).getTime();
  const firstDueDate = new Date(Date.now()).getTime();
  const dueTimestamp = firstDueDate - initialDate;

  return Math.floor(dueTimestamp / period);
};

const calculateNewDebt = (lateDebt: Debt): Debt => {
  const copyDebt = JSON.parse(JSON.stringify(lateDebt));
  const firstDueDate = new Date(copyDebt.due_dates[0]);

  const period = getPeriod([copyDebt.initial_date, ...copyDebt.due_dates]);

  const daysLate = getDaysLate(firstDueDate);
  const daysSinceFirsDueDate = daysLate > 0 ? daysLate : 0;

  const feeFactor = dueDateFactor(copyDebt.initial_value, copyDebt.fee, period);
  const lateFactor = lateFeeFactor(copyDebt.late_fee, daysSinceFirsDueDate);

  const value = lateFactor + feeFactor;

  copyDebt.value = Math.round((value + Number.EPSILON) * 100) / 100;

  return copyDebt;
};

const calculateNewDueDates = (lateDebt: Debt): Debt => {
  const copyDebt = JSON.parse(JSON.stringify(lateDebt));

  const currentDate = dataMaisProximaHoje(copyDebt?.due_dates);
  const isLast = currentDate?.posicao === copyDebt?.due_dates?.length - 1;

  if (isLast) {
    const currentDueDate = currentDate?.data;
    const dateArr = [copyDebt.initial_date, ...copyDebt.due_dates];

    const fullPeriod = getPeriod([
      copyDebt.initial_date,
      ...copyDebt.due_dates,
    ]);

    const period = getPeriodInDays(dateArr);
    const nextDates = new Array(fullPeriod - copyDebt.due_dates.length + 4).fill(0).map((_, i) => {
      const daysCount = (i + 1) * period;

      return new Date(
        timestampFromNow({
          initial_date: currentDueDate,
          days: daysCount,
        }),
      );
    });

    const newDueDates = [...copyDebt.due_dates, ...nextDates];
    copyDebt.due_dates = newDueDates;

    return copyDebt;
  }

  return copyDebt;
};
