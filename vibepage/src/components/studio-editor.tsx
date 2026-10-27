"use client";
import { ProfileView } from "@/components/profile-view";
import { applyAppearance, captureAppearance } from "@/lib/appearance-config";
import { useState } from "react";
import Link from "next/link";
import { useFieldArray, type UseFormReturn } from "react-hook-form";
import {
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  LayoutGrid,
  Upload,
} from "lucide-react";
import {
  sectionNames,
  defaultStudio,
  studioSchema,
  layoutNames,
  blockNames,
  blockKinds,
} from "@/lib/studio-schema";
import {
  profileTemplates,
  applyProfileTemplate,
} from "@/lib/profile-templates";
import type { ProfileInput } from "@/lib/validation";
import { clientId } from "@/lib/client-id";
export function StudioEditor({
  form,
  profile,
  pro,
  demo,
  uploadGallery,
}: {
  form: UseFormReturn<ProfileInput>;
  profile: ProfileInput;
  pro: boolean;
  demo: boolean;
  uploadGallery: (file: File, index: number) => Promise<void>;
}) {
  const { register, setValue, control } = form;
  const fields = useFieldArray({
    control,
    name: "blocks",
    keyName: "fieldKey",
  });
  const [category, setCategory] = useState("Todos");
  const [before, setBefore] = useState<ProfileInput | null>(null);
  const [template, setTemplate] = useState("");
  const apply = (id: string) => {
    if (!id) return;
    setBefore(structuredClone(profile));
    const next = applyProfileTemplate(profile, id);
    for (const key of [
      "studio",
      "themeId",
      "accentColor",
      "backgroundColor",
      "fontFamily",
      "buttonStyle",
      "backgroundEffect",
      "avatarEffect",
      "buttonEffect",
      "entranceEffect",
      "gamerCards",
    ] as const)
      setValue(key, next[key] as never, { shouldDirty: true });
  };
  if (!pro)
    return (
      <div className="editor-fields">
        <p className="kicker">PROFILE STUDIO 3.0</p>
        <h2>Organize seu universo.</h2>
        <p>
          Layouts, blocos e modelos originais ficam no Pro. Seu perfil Free
          continua disponível e as configurações Pro já salvas ficam privadas.
        </p>
        <Link className="button button-secondary" href="/demo/pro">
          Conhecer o Pro
        </Link>
        <Link className="text-button" href="/demo">
          Experimentar o Studio na demonstração
        </Link>
        <details>
          <summary>Ver prévia Pro com meu perfil</summary>
          <p>
            Prévia visual. Nenhuma permissão é concedida ou gravada na conta.
          </p>
          <ProfileView
            profile={applyProfileTemplate(profile, "gamer-grid")}
            preview
            pro
          />
        </details>
        <button
          type="button"
          className="button button-secondary"
          onClick={() => apply("minimal")}
        >
          Aplicar modelo Free Quiet Focus
        </button>
      </div>
    );

  return (
    <div className="editor-fields">
      <div>
        <p className="kicker">PROFILE STUDIO 3.0</p>
        <h2>Construa sua identidade.</h2>
        <p className="panel-description">
          Organize seções e blocos. A prévia usa a mesma composição da página
          pública.
        </p>
      </div>
      <label>
        Layout
        <select {...register("studio.layout")}>
          {Object.entries(layoutNames).map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <div className="card-form-grid">
        <label>
          Largura
          <select {...register("studio.width")}>
            <option value="standard">Padrão</option>
            <option value="wide">Ampla</option>
          </select>
        </label>
        <label>
          Colunas desktop
          <select {...register("studio.columns", { setValueAs: Number })}>
            <option value="1">Uma</option>
            <option value="2">Duas</option>
          </select>
        </label>
        <label>
          Espaçamento
          <select {...register("studio.spacing")}>
            <option value="compact">Compacto</option>
            <option value="normal">Normal</option>
            <option value="airy">Amplo</option>
          </select>
        </label>
        <label>
          Grade de cartões
          <select {...register("studio.cardColumns", { setValueAs: Number })}>
            <option value="1">Uma coluna</option>
            <option value="2">Duas colunas</option>
          </select>
        </label>
      </div>
      <h3>Ordem e visibilidade das seções</h3>
      <small>
        Use os botões com teclado. Ao menos uma seção deve continuar visível.
      </small>
      {profile.studio.order.map((id, i) => (
        <div className="studio-order-row" key={id}>
          <strong>{sectionNames[id]}</strong>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={!profile.studio.hidden.includes(id)}
              onChange={(e) =>
                setValue(
                  "studio.hidden",
                  e.target.checked
                    ? profile.studio.hidden.filter((v) => v !== id)
                    : [...profile.studio.hidden, id].slice(0, 3),
                  { shouldDirty: true },
                )
              }
            />
            Mostrar
          </label>
          <label>
            Largura
            <select
              {...register(`studio.widths.${id}`, { setValueAs: Number })}
            >
              <option value="1">Uma coluna</option>
              <option value="2">Linha inteira</option>
            </select>
          </label>
          <button
            type="button"
            aria-label={`Mover seção ${sectionNames[id]} para cima`}
            disabled={!i}
            onClick={() => {
              const order = [...profile.studio.order];
              [order[i - 1], order[i]] = [order[i], order[i - 1]];
              setValue("studio.order", order, { shouldDirty: true });
            }}
          >
            <ArrowUp size={16} />
          </button>
          <button
            type="button"
            aria-label={`Mover seção ${sectionNames[id]} para baixo`}
            disabled={i === 3}
            onClick={() => {
              const order = [...profile.studio.order];
              [order[i + 1], order[i]] = [order[i], order[i + 1]];
              setValue("studio.order", order, { shouldDirty: true });
            }}
          >
            <ArrowDown size={16} />
          </button>
        </div>
      ))}
      <button
        className="button button-secondary"
        type="button"
        onClick={() => {
          if (
            window.confirm(
              "Restaurar apenas o layout? Seu conteúdo será preservado.",
            )
          )
            setValue("studio", studioSchema.parse(defaultStudio), {
              shouldDirty: true,
            });
        }}
      >
        Restaurar layout padrão
      </button>
      <details className="template-gallery">
        <summary>Modelos de composição originais</summary>
        <label>
          Categoria
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {["Todos", ...new Set(profileTemplates.map((t) => t.category))].map(
              (c) => (
                <option key={c}>{c}</option>
              ),
            )}
          </select>
        </label>
        <div className="template-grid">
          {profileTemplates
            .filter((t) => category === "Todos" || t.category === category)
            .map((t) => (
              <button
                type="button"
                key={t.id}
                aria-pressed={template === t.id}
                onClick={() => setTemplate(t.id)}
              >
                <LayoutGrid size={22} />
                <strong>{t.name}</strong>
                <small>
                  {t.category} · {t.premium ? "Pro" : "Free"}
                </small>
                <p>{t.description}</p>
              </button>
            ))}
        </div>
        {template && (
          <div className="template-full-preview">
            <ProfileView
              profile={applyProfileTemplate(profile, template)}
              preview
              pro
            />
          </div>
        )}
        {template && (
          <button
            type="button"
            className="button"
            onClick={() => apply(template)}
          >
            Aplicar modelo na prévia
          </button>
        )}
        {before && (
          <button
            type="button"
            className="text-button"
            onClick={() => {
              const restored = applyAppearance(
                profile,
                captureAppearance(before),
              );
              for (const key of [
                "studio",
                "themeId",
                "accentColor",
                "backgroundColor",
                "fontFamily",
                "buttonStyle",
                "backgroundEffect",
                "avatarEffect",
                "buttonEffect",
                "entranceEffect",
                "gamerCards",
              ] as const)
                setValue(key, restored[key] as never, { shouldDirty: true });
              setBefore(null);
            }}
          >
            Restaurar aparência anterior ao modelo
          </button>
        )}
        <p>
          O modelo reorganiza somente a aparência. Links, cartões e conteúdo dos
          blocos são preservados. Salve para aplicar publicamente.
        </p>
      </details>
      <h3>Blocos personalizados · {fields.fields.length}/16</h3>
      {fields.fields.map((field, index) => {
        const block = profile.blocks[index] ?? field;
        return (
          <div className="link-edit-card" key={field.fieldKey}>
            <div className="link-edit-heading">
              <span>{blockNames[block.kind]}</span>
              <div>
                <button
                  type="button"
                  aria-label={`Mover bloco ${index + 1} para cima`}
                  disabled={!index}
                  onClick={() => fields.move(index, index - 1)}
                >
                  <ArrowUp size={16} />
                </button>
                <button
                  type="button"
                  aria-label={`Mover bloco ${index + 1} para baixo`}
                  disabled={index === fields.fields.length - 1}
                  onClick={() => fields.move(index, index + 1)}
                >
                  <ArrowDown size={16} />
                </button>
                <button
                  type="button"
                  aria-label={`Remover bloco ${index + 1}`}
                  onClick={() => fields.remove(index)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <label>
              Tipo
              <select {...register(`blocks.${index}.kind`)}>
                {blockKinds.map((k) => (
                  <option key={k} value={k}>
                    {blockNames[k]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Título
              <input {...register(`blocks.${index}.title`)} maxLength={80} />
            </label>
            <label>
              Descrição
              <textarea
                {...register(`blocks.${index}.description`)}
                maxLength={600}
                rows={3}
              />
            </label>
            <div className="card-form-grid">
              <label>
                Ícone
                <select {...register(`blocks.${index}.icon`)}>
                  <option value="gamepad">Controle</option>
                  <option value="swords">Espadas</option>
                  <option value="blocks">Blocos</option>
                  <option value="sparkles">Estrelas</option>
                  <option value="headset">Headset</option>
                </select>
              </label>
              <label>
                Largura
                <select
                  {...register(`blocks.${index}.width`, { setValueAs: Number })}
                >
                  <option value="1">Uma coluna</option>
                  <option value="2">Linha inteira</option>
                </select>
              </label>
            </div>
            <label className="checkbox-label">
              <input type="checkbox" {...register(`blocks.${index}.hidden`)} />
              Ocultar bloco
            </label>
            {(block.kind === "project" ||
              block.kind === "social" ||
              block.kind === "spotlight") && (
              <label>
                Link HTTPS opcional
                <input
                  type="url"
                  {...register(`blocks.${index}.url`)}
                  maxLength={2048}
                />
              </label>
            )}
            {block.kind === "favorites" && (
              <label>
                Jogos favoritos (um por linha, até 12)
                <textarea
                  defaultValue={field.items.join("\n")}
                  onChange={(e) =>
                    setValue(
                      `blocks.${index}.items`,
                      e.target.value
                        .split("\n")
                        .map((v) => v.trim())
                        .filter(Boolean)
                        .slice(0, 12),
                      { shouldDirty: true },
                    )
                  }
                  maxLength={970}
                />
              </label>
            )}
            {block.kind === "achievement" && (
              <>
                <label>
                  Jogo relacionado
                  <input {...register(`blocks.${index}.game`)} maxLength={80} />
                </label>
                <label>
                  Data opcional
                  <input type="date" {...register(`blocks.${index}.date`)} />
                </label>
                <small>
                  Será identificada como conquista informada por você, sem
                  verificação oficial.
                </small>
              </>
            )}
            {block.kind === "spotlight" && (
              <label>
                Cartão em destaque
                <select
                  value={block.cardId ?? ""}
                  onChange={(e) =>
                    setValue(`blocks.${index}.cardId`, e.target.value || null, {
                      shouldDirty: true,
                    })
                  }
                >
                  <option value="">Sem cartão vinculado</option>
                  {profile.gamerCards.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.displayName}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {block.kind === "gallery" && (
              <>
                <p>
                  {block.imageKeys.length}/6 imagens · até 18 imagens de galeria
                  por conta.
                </p>
                <label className="upload-label">
                  <Upload size={15} />
                  Adicionar imagem
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    disabled={demo || block.imageKeys.length >= 6}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void uploadGallery(file, index);
                      e.currentTarget.value = "";
                    }}
                  />
                </label>
                {block.imageKeys.map((key, i) => (
                  <button
                    type="button"
                    className="text-button"
                    key={key}
                    onClick={() =>
                      setValue(
                        `blocks.${index}.imageKeys`,
                        block.imageKeys.filter((k) => k !== key),
                        { shouldDirty: true },
                      )
                    }
                  >
                    Remover imagem {i + 1}
                  </button>
                ))}
                {demo && (
                  <small>
                    Uploads exigem uma conta no aplicativo com banco.
                  </small>
                )}
              </>
            )}
            {form.formState.errors.blocks?.[index] && (
              <p className="field-error" role="alert">
                Confira o título, links, data e limites do bloco.
              </p>
            )}
          </div>
        );
      })}
      <button
        className="button button-secondary"
        type="button"
        disabled={fields.fields.length >= 16}
        onClick={() =>
          fields.append({
            id: clientId(),
            kind: "about",
            title: "Sobre mim",
            description: "",
            icon: "sparkles",
            url: "",
            imageKeys: [],
            items: [],
            game: "",
            date: "",
            cardId: null,
            hidden: false,
            width: 2,
          })
        }
      >
        <Plus size={16} />
        Adicionar bloco
      </button>
      {!demo && (
        <Link className="text-button" href="/dashboard/aparencias">
          Coleções e agendamentos sazonais →
        </Link>
      )}
    </div>
  );
}
