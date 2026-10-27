"use client";
import { clientId } from "@/lib/client-id";
import { useFieldArray, type UseFormReturn } from "react-hook-form";
import { ArrowDown, ArrowUp, Plus, Trash2, Upload } from "lucide-react";
import {
  games,
  gameNames,
  cardStyles,
  cardStyleNames,
  FREE_CARD_LIMIT,
  PRO_CARD_LIMIT,
} from "@/lib/customization";
import type { ProfileInput } from "@/lib/validation";
export function GamerCardEditor({
  form,
  pro,
  demo,
  upload,
  onSelect,
}: {
  form: UseFormReturn<ProfileInput>;
  pro: boolean;
  demo: boolean;
  onSelect?: (id: string) => void;
  upload: (file: File, index: number) => Promise<void>;
}) {
  const {
    register,
    control,
    formState: { errors },
    setValue,
  } = form;
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "gamerCards",
    keyName: "fieldKey",
  });
  const limit = pro ? PRO_CARD_LIMIT : FREE_CARD_LIMIT;
  return (
    <div className="editor-fields">
      <div>
        <p className="kicker">SEU LOADOUT SOCIAL</p>
        <h2>Identidade de jogador.</h2>
        <p className="panel-description">
          {fields.length}/{limit} cartões · Dados informados por você. Sem
          status online ou vínculo oficial com os jogos.
        </p>
      </div>
      {fields.length > limit && (
        <p role="status" className="analytics-note">
          Seu plano exibe até {limit} cartões no perfil público. Os demais
          continuam privados e podem ser mantidos ao salvar. Para adicionar um
          cartão novo, respeite o limite do plano.
        </p>
      )}
      {fields.map((field, index) => (
        <div
          className="link-edit-card gamer-edit-card"
          onFocusCapture={() => onSelect?.(field.id)}
          key={field.fieldKey}
        >
          <div className="link-edit-heading">
            <span>CARTÃO {String(index + 1).padStart(2, "0")}</span>
            <div>
              <button
                type="button"
                aria-label={`Mover cartão ${index + 1} para cima`}
                title={`Mover cartão ${index + 1} para cima`}
                disabled={!index}
                onClick={() => move(index, index - 1)}
              >
                <ArrowUp size={16} />
              </button>
              <button
                type="button"
                aria-label={`Mover cartão ${index + 1} para baixo`}
                title={`Mover cartão ${index + 1} para baixo`}
                disabled={index === fields.length - 1}
                onClick={() => move(index, index + 1)}
              >
                <ArrowDown size={16} />
              </button>
              <button
                type="button"
                aria-label={`Remover cartão ${index + 1}`}
                title={`Remover cartão ${index + 1}`}
                onClick={() => remove(index)}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
          <div className="card-form-grid">
            <label>
              Jogo ou comunidade
              <select {...register(`gamerCards.${index}.game`)}>
                {games.map((game) => (
                  <option key={game} value={game}>
                    {gameNames[game]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Nome de exibição
              <input
                {...register(`gamerCards.${index}.displayName`)}
                maxLength={60}
              />
            </label>
            <label>
              Username / nome no jogo
              <input
                {...register(`gamerCards.${index}.handle`)}
                maxLength={60}
              />
            </label>
            <label>
              Jogo, comunidade ou servidor favorito
              <input
                {...register(`gamerCards.${index}.detail`)}
                maxLength={100}
              />
            </label>
            <label>
              Edição Minecraft
              <select {...register(`gamerCards.${index}.edition`)}>
                <option value="">Não se aplica</option>
                <option value="java">Java</option>
                <option value="bedrock">Bedrock</option>
              </select>
            </label>
            <label>
              Link HTTPS (opcional)
              <input
                {...register(`gamerCards.${index}.url`)}
                maxLength={2048}
                type="url"
                placeholder="https://…"
              />
            </label>
            <label>
              Visual
              <select {...register(`gamerCards.${index}.style`)}>
                {cardStyles.map((style, i) => (
                  <option
                    key={style}
                    value={style}
                    disabled={!pro && !["neon", "minimal"].includes(style)}
                  >
                    {cardStyleNames[i]}
                    {!["neon", "minimal"].includes(style) ? " · Pro" : ""}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Layout
              <select
                {...register(`gamerCards.${index}.layout`)}
                disabled={!pro}
              >
                <option value="compact">Compacto</option>
                <option value="banner">Banner · Pro</option>
              </select>
            </label>
            <label>
              Ícone
              <select {...register(`gamerCards.${index}.icon`)}>
                <option value="gamepad">Controle</option>
                <option value="swords">Espadas</option>
                <option value="blocks">Blocos</option>
                <option value="sparkles">Estrelas</option>
                <option value="headset">Headset</option>
              </select>
            </label>
            <label className="color-control">
              Cor
              <input type="color" {...register(`gamerCards.${index}.color`)} />
            </label>
          </div>
          <div className="card-edit-actions">
            <label className="checkbox-label">
              <input
                type="checkbox"
                {...register(`gamerCards.${index}.glow`)}
                disabled={!pro}
              />
              Borda luminosa · Pro
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                {...register(`gamerCards.${index}.animated`)}
                disabled={!pro}
              />
              Animação · Pro
            </label>
          </div>
          <label className="upload-label">
            <Upload size={15} /> Avatar do cartão
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={demo}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void upload(file, index);
                e.currentTarget.value = "";
              }}
            />
          </label>
          <button
            type="button"
            className="text-button"
            onClick={() =>
              setValue(`gamerCards.${index}.avatarKey`, null, {
                shouldDirty: true,
              })
            }
          >
            Remover avatar
          </button>
          {errors.gamerCards?.[index] && (
            <p className="field-error" role="alert">
              {Object.values(errors.gamerCards[index]!)
                .map((e) =>
                  typeof e === "object" && e && "message" in e
                    ? String(e.message)
                    : "",
                )
                .filter(Boolean)
                .join(" · ") || "Confira os campos do cartão."}
            </p>
          )}
        </div>
      ))}
      {!fields.length && (
        <p className="editor-empty">
          Seu primeiro cartão pode ser do seu game favorito.
        </p>
      )}
      <button
        type="button"
        className="button button-secondary"
        disabled={fields.length >= limit}
        onClick={() =>
          append({
            id: clientId(),
            game: "roblox",
            displayName: "",
            handle: "",
            detail: "",
            edition: "",
            url: "",
            avatarKey: null,
            color: "#a78bfa",
            style: "minimal",
            layout: "compact",
            icon: "gamepad",
            glow: false,
            animated: false,
          })
        }
      >
        <Plus size={17} />
        Adicionar cartão gamer
      </button>
      {errors.gamerCards?.message && (
        <p className="field-error">{errors.gamerCards.message}</p>
      )}
      <small>
        Avatares: PNG, JPEG ou WebP de até 4 MB. Salve para liberar imagens de
        cartões removidos.
      </small>
    </div>
  );
}
