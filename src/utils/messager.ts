import axios from "axios";
import nodemailer from "nodemailer";
import Costumer from "../entities/Costumers";
import Debt from "../entities/Debt";
import { CostumerModel, DebtModel } from "../mongoose/mongodb";
import WhatsApp from "whatsapp";
import { UpdateOrCreate } from "../mongoose/utils";

export function sendWppMsg(phone: number) {
  // Your test sender phone number

  const senderNumber = process.env.sender_number as string;

  const wa = new WhatsApp(Number(senderNumber));

  // Enter the recipient phone number
  const recipient_number = phone;

  async function send_message() {
    try {
      const sent_text_message = wa.messages.text(
        { body: "Hello world" },
        recipient_number,
      );

      await sent_text_message.then((res: any) => {
        console.log(res.rawResponse());
      });
    } catch (e) {
      console.log(JSON.stringify(e));
    }
  }

  send_message();
}

export async function sendEmail(costumer: Costumer, debt: Debt, msg?: string) {
  const name = costumer.name;
  const from = "Heron";
  const message = `Sua divida de ${
    debt.description
  } chegou ao prazo final, por isso foi acrescentado uma multa de R$${debt.late_fee.toFixed(
    2,
  )} por dia de atraso e agora o valor total é R$${debt.value}`;
  const to = costumer.email;
  const smtpTransport = nodemailer.createTransport({
    service: "Gmail",
    host: "smtp.gmail.com",
    auth: {
      user: "heronoadev@gmail.com",
      pass: "pcsp gmeh ksnb kkau",
    },
  });
  const mailOptions = {
    from: from,
    to: to,
    subject: name + " | new message !",
    text: msg,
  };

  let result;
  let error;
  smtpTransport.sendMail(mailOptions, function (error, response) {
    if (error) {
      console.log(error);
    }
    result = response;
  });

  return { result, error };
}
export async function sendRecoverEmail(email: string, msg?: string) {
  const from = "Heron";
  const message = msg;
  const to = email;
  const smtpTransport = nodemailer.createTransport({
    service: "Gmail",
    host: "smtp.gmail.com",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASS,
    },
  });
  const mailOptions = {
    from: from,
    to: to,
    subject: "Recuperação de senha - Payments - Não responda",
    text: message,
  };

  let result;
  let error;
  smtpTransport.sendMail(mailOptions, function (error, response) {
    if (error) {
      console.log(error);
    }
    result = response;
  });

  return { result, error };
}

export async function mailToLateDebts(lateDebts: Debt[], type = "late") {
  try {
    lateDebts.forEach(async debt => {
      try {
        const costumerInDebt = await CostumerModel.findOne({
          costumer_id: debt.costumer_id,
        });

        if (costumerInDebt) {
          const response = await sendEmail(
            costumerInDebt,
            debt,
            emailExample?.[type]({
              value: debt.value,
              date: debt.due_dates[debt.callings],
              description: debt.description,
              name: costumerInDebt.last_name,
            }) || undefined,
          );

          if (!response?.error) {
            const newCallings = debt.callings + 1;
            UpdateOrCreate(
              DebtModel,
              { debt_id: debt.debt_id },
              { callings: newCallings },
            );
          }
        }
      } catch (err) {
        console.log({ err });
      }
    });
    return lateDebts;
  } catch (error) {
    console.error("Erro ao buscar linhas:", error);
    throw error;
  }
}

const emailExample: {
  [key: string]: (details: {
    [key: string]: string | number | Date | undefined;
  }) => string;
} = {
  late: ({ value, date, description, name }) => `Prezado(a) Sr. ${name}
  Esperamos que este e-mail o encontre bem. Estamos escrevendo para lembrá-lo(a) de que sua dívida conosco venceu.
  Detalhes da dívida:
  
    Novo Valor: R$${Number(value).toFixed(2)}
    Data de Vencimento: ${String(date).split("T")[0].split("-").join("/")}
    Descrição da Dívida: ${description}
  
  Por favor, tome as medidas necessárias para garantir que o pagamento seja feito até a data de vencimento mencionada acima. Se você já efetuou o pagamento, por favor, desconsidere esta mensagem.
  Se precisar de mais informações ou se tiver alguma dúvida, não hesite em nos contatar. Estamos aqui para ajudar.
  Atenciosamente, Heron Amaral
`,
};
