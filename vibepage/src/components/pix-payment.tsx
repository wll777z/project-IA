"use client";
import { useState } from "react";

const pixKey = "+5511949345361";
export function PixPayment({ email }: { email: string }) {
  const [message, setMessage] = useState("");
  const subject = encodeURIComponent("Comprovante Pix — VibePage Pro");
  const body = encodeURIComponent(
    `Olá, Wendell! Quero ativar o VibePage Pro.\nE-mail da minha conta: ${email}\nValor: R$ 9,90\nVou anexar o comprovante do Pix neste e-mail.`,
  );
  return (
    <section className="workspace-card">
      <h2>Pro por R$ 9,90 / mês</h2>
      <p>
        Pagamento único por Pix para um mês de acesso, sem renovação automática.
      </p>
      <ol>
        <li>Abra o app do seu banco e escolha Pix por chave de telefone.</li>
        <li>Informe a chave abaixo e o valor de R$ 9,90.</li>
        <li>Confira o recebedor e o banco antes de confirmar.</li>
        <li>
          Envie o comprovante com o e-mail da sua conta para solicitar a
          ativação.
        </li>
      </ol>
      <p>
        Recebedor: <strong>Wendell Pereira</strong>
      </p>
      <p>
        Banco: <strong>Nubank</strong>
      </p>
      <label className="auth-form">
        Chave Pix (telefone)
        <input readOnly value={pixKey} aria-label="Chave Pix de telefone" />
      </label>
      <button
        className="button"
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(pixKey);
            setMessage(
              "Chave copiada. Confira o recebedor no banco antes de pagar.",
            );
          } catch {
            setMessage("Selecione e copie a chave no campo acima.");
          }
        }}
      >
        Copiar chave Pix
      </button>
      {message && <p role="status">{message}</p>}
      <p>
        Conta para ativação: <strong>{email}</strong>
      </p>
      <p>
        Envie o comprovante para{" "}
        <a
          className="text-button"
          href={`mailto:wendellpereira087@gmail.com?subject=${subject}&body=${body}`}
        >
          wendellpereira087@gmail.com
        </a>
        . Anexe o comprovante antes de enviar.
      </p>
      <p className="status-message">
        A ativação é manual, após conferência do recebimento. Copiar a chave ou
        enviar um comprovante não libera o Pro automaticamente. Não pague se o
        banco mostrar outro recebedor.
      </p>
    </section>
  );
}
