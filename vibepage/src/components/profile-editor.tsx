"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Check,
  LoaderCircle,
  LockKeyhole,
  Eye,
  Save,
  Upload,
  Palette,
  Link2,
  UserRound,
} from "lucide-react";
import { profileSchema, type ProfileInput } from "@/lib/validation";
import { themes } from "@/lib/themes";
import { ProfileView } from "@/components/profile-view";
export function ProfileEditor({
  initial,
  pro,
  demo = false,
}: {
  initial: ProfileInput;
  pro: boolean;
  demo?: boolean;
}) {
  const router = useRouter();
  const [tab, setTab] = useState("identity");
  const [status, setStatus] = useState("");
  const [uploading, setUploading] = useState("");
  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    getValues,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: initial,
  });
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "links",
    keyName: "fieldKey",
  });
  const profile = useWatch({ control }) as ProfileInput;
  useEffect(() => {
    if (!demo) return;
    try {
      const saved = localStorage.getItem("vibepage:demo");
      if (saved) {
        const parsed = profileSchema.safeParse(JSON.parse(saved));
        if (parsed.success) reset(parsed.data);
      }
    } catch {}
  }, [demo, reset]);
  useEffect(() => {
    function warn(e: BeforeUnloadEvent) {
      if (isDirty) {
        e.preventDefault();
      }
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);
  async function upload(kind: "avatar" | "background", file?: File) {
    if (!file || demo) return;
    if (file.size > 4 * 1024 * 1024) {
      setStatus("Use uma imagem de até 4 MB.");
      return;
    }
    setUploading(kind);
    setStatus("");
    try {
      const r = await fetch(`/api/uploads/${kind}`, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setValue(kind === "avatar" ? "avatarKey" : "backgroundKey", data.key, {
        shouldDirty: true,
      });
      setStatus("Imagem enviada. Salve o perfil para aplicar a seleção.");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Falha ao enviar imagem.");
    } finally {
      setUploading("");
    }
  }
  return (
    <form
      className="editor-grid"
      onSubmit={handleSubmit(
        async (data) => {
          setStatus("");
          if (demo) {
            try {
              const saved = { ...data, revision: data.revision + 1 };
              localStorage.setItem("vibepage:demo", JSON.stringify(saved));
              reset(saved);
              setStatus(
                "Demonstração salva neste navegador. Nenhuma página pública foi criada.",
              );
            } catch {
              setStatus("Seu navegador não permitiu salvar a demonstração.");
            }
            return;
          }
          try {
            const response = await fetch("/api/profile", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error);
            reset(result.profile);
            setStatus("Perfil salvo com sucesso.");
            router.refresh();
          } catch (e) {
            setStatus(
              e instanceof Error ? e.message : "Não foi possível salvar.",
            );
          }
        },
        () => setStatus("Confira os campos destacados, incluindo os links."),
      )}
    >
      <div className="editor-controls">
        <div className="editor-tabs" role="group" aria-label="Seções do editor">
          {[
            ["identity", UserRound, "Perfil"],
            ["links", Link2, "Links"],
            ["style", Palette, "Estilo"],
          ].map(([id, Icon, label]) => {
            const I = Icon as typeof UserRound;
            return (
              <button
                key={String(id)}
                type="button"

                aria-pressed={tab === id}
                onClick={() => setTab(String(id))}
              >
                <I size={16} />
                {String(label)}
                {id === "identity" &&
                  (errors.username || errors.displayName || errors.bio) && (
                    <span className="tab-error">!</span>
                  )}
                {id === "links" && errors.links && (
                  <span className="tab-error">!</span>
                )}
              </button>
            );
          })}
        </div>
        <div className="editor-panel">
          {tab === "identity" && (
            <div className="editor-fields">
              <div>
                <p className="kicker">SUA IDENTIDADE</p>
                <h2>Mostre quem você é.</h2>
                <p className="panel-description">
                  Um nome, uma bio e um universo de possibilidades.
                </p>
              </div>
              <label>
                Nome público
                <input
                  {...register("displayName")}
                  maxLength={60}
                  placeholder="Como você quer aparecer?"
                />
                {errors.displayName && (
                  <span className="field-error">
                    {errors.displayName.message}
                  </span>
                )}
              </label>
              <label>
                Username
                <div className="username-field">
                  <span>/</span>
                  <input
                    {...register("username")}
                    maxLength={24}
                    placeholder="seu_username"
                    autoCapitalize="none"
                    spellCheck={false}
                  />
                </div>
                <small>
                  3–24 letras, números ou _. O nome só é reservado ao salvar.
                </small>
                {errors.username && (
                  <span className="field-error">
                    Escolha um username válido e disponível.
                  </span>
                )}
              </label>
              <label>
                Biografia
                <textarea
                  {...register("bio")}
                  maxLength={240}
                  rows={4}
                  placeholder="O que faz parte da sua vibe?"
                />
                <small>{profile.bio?.length || 0}/240</small>
                {errors.bio && (
                  <span className="field-error">{errors.bio.message}</span>
                )}
              </label>
              <div className="upload-grid">
                {(["avatar", "background"] as const).map((kind) => (
                  <div className="upload-box" key={kind}>
                    <Upload size={19} />
                    <strong>
                      {kind === "avatar" ? "Avatar" : "Imagem de fundo"}
                    </strong>
                    <label className="upload-label">
                      {uploading === kind ? "Enviando…" : "Escolher imagem"}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        disabled={!!uploading || demo}
                        onChange={(e) => {
                          void upload(kind, e.target.files?.[0]);
                          e.currentTarget.value = "";
                        }}
                      />
                    </label>
                    <small>
                      {demo
                        ? "Uploads disponíveis no aplicativo com conta."
                        : "JPG, PNG ou WebP · até 4 MB"}
                    </small>
                    {(kind === "avatar"
                      ? profile.avatarKey
                      : profile.backgroundKey) && (
                      <button
                        type="button"
                        className="text-button"
                        onClick={() =>
                          setValue(
                            kind === "avatar" ? "avatarKey" : "backgroundKey",
                            null,
                            { shouldDirty: true },
                          )
                        }
                      >
                        Remover do perfil
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {tab === "links" && (
            <div className="editor-fields">
              <div>
                <p className="kicker">TUDO CONECTADO</p>
                <h2>Seus links. Seu mundo.</h2>
                <p className="panel-description">
                  Canal, rede social, portfólio, comunidade. Até 100 links
                  HTTPS.
                </p>
              </div>
              {!fields.length && (
                <div className="editor-empty">
                  <Link2 size={28} />
                  <h3>Qual é o seu primeiro destino?</h3>
                  <p>Adicione um link para começar.</p>
                </div>
              )}
              {fields.map((field, index) => (
                <div key={field.fieldKey} className="link-edit-card">
                  <div className="link-edit-heading">
                    <span>LINK {String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <button
                        type="button"
                        aria-label={`Mover link ${index + 1} para cima`}
                        disabled={index === 0}
                        onClick={() => move(index, index - 1)}
                      >
                        <ArrowUp size={15} />
                      </button>
                      <button
                        type="button"
                        aria-label={`Mover link ${index + 1} para baixo`}
                        disabled={index === fields.length - 1}
                        onClick={() => move(index, index + 1)}
                      >
                        <ArrowDown size={15} />
                      </button>
                      <button
                        type="button"
                        aria-label={`Remover link ${index + 1}`}
                        onClick={() => remove(index)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                  <label>
                    Título
                    <input
                      {...register(`links.${index}.title`)}
                      maxLength={80}
                      placeholder="Meu canal"
                    />
                    {errors.links?.[index]?.title && (
                      <span className="field-error">
                        {errors.links[index]?.title?.message}
                      </span>
                    )}
                  </label>
                  <label>
                    URL HTTPS
                    <input
                      {...register(`links.${index}.url`)}
                      placeholder="https://…"
                      type="url"
                      maxLength={2048}
                    />
                    {errors.links?.[index]?.url && (
                      <span className="field-error">
                        {errors.links[index]?.url?.message}
                      </span>
                    )}
                  </label>
                </div>
              ))}
              {errors.links?.message && (
                <p className="field-error">{errors.links.message}</p>
              )}
              <button
                className="button button-secondary"
                type="button"
                disabled={fields.length >= 100}
                onClick={() =>
                  append({ id: crypto.randomUUID(), title: "", url: "" })
                }
              >
                <Plus size={17} /> Adicionar link
              </button>
            </div>
          )}
          {tab === "style" && (
            <div className="editor-fields">
              <div>
                <p className="kicker">ESCOLHA SUA ATMOSFERA</p>
                <h2>O seu estilo começa aqui.</h2>
              </div>
              <div className="theme-picker">
                {themes.map((theme) => (
                  <button
                    className={profile.themeId === theme.id ? "selected" : ""}
                    key={theme.id}
                    type="button"
                    disabled={theme.premium && !pro}
                    onClick={() => {
                      setValue("themeId", theme.id, { shouldDirty: true });
                      setValue("accentColor", theme.accent, {
                        shouldDirty: true,
                      });
                      setValue("backgroundColor", theme.background, {
                        shouldDirty: true,
                      });
                    }}
                  >
                    <span className={`theme-swatch ${theme.className}`}>
                      <i />
                      {profile.themeId === theme.id && <Check size={17} />}
                    </span>
                    <strong>{theme.name}</strong>
                    {theme.premium && (
                      <small>
                        <LockKeyhole size={10} /> PRO
                      </small>
                    )}
                  </button>
                ))}
              </div>
              <label className="color-control">
                Cor de destaque
                <input type="color" {...register("accentColor")} />
              </label>
              <div
                className={`advanced-options ${!pro ? "locked-options" : ""}`}
              >
                <h3>
                  <LockKeyhole size={15} /> Personalização Pro
                </h3>
                {!pro && (
                  <p>
                    Temas premium, animações e opções avançadas. Sem cobrança
                    nesta versão.
                  </p>
                )}
                <label className="color-control">
                  Cor de fundo
                  <input
                    type="color"
                    {...register("backgroundColor")}
                    disabled={!pro}
                  />
                </label>
                <label>
                  Formato dos botões
                  <select {...register("buttonStyle")} disabled={!pro}>
                    <option value="soft">Suave</option>
                    <option value="outline">Contorno</option>
                    <option value="pill">Arredondado</option>
                  </select>
                </label>
                <label>
                  Animação
                  <select {...register("animation")} disabled={!pro}>
                    <option value="none">Discreta</option>
                    <option value="float">Flutuar</option>
                    <option value="glow">Brilho</option>
                  </select>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    {...register("hideBranding")}
                    disabled={!pro}
                  />{" "}
                  Remover a marca VibePage
                </label>
              </div>
            </div>
          )}
        </div>
        <div className="editor-save">
          <label className="checkbox-label">
            <input type="checkbox" {...register("published")} /> Perfil público
          </label>
          <p>
            {demo
              ? "Demonstração local: nenhuma página será publicada."
              : profile.published
                ? "Ao salvar, seu perfil ficará visível pelo link."
                : "Rascunho: apenas você pode ver."}
          </p>
          {status && (
            <p role="status" className="status-message">
              {status}
            </p>
          )}
          <button
            className="button"
            type="submit"
            disabled={isSubmitting || !!uploading}
          >
            {isSubmitting ? (
              <LoaderCircle className="spinner" size={17} />
            ) : (
              <Save size={17} />
            )}{" "}
            {isSubmitting ? "Salvando…" : "Salvar alterações"}
          </button>
          <span className="save-hint">
            {isDirty ? "Há alterações não salvas" : "Tudo em dia"}
          </span>
        </div>
      </div>
      <aside className="editor-preview">
        <div className="preview-heading">
          <span>
            <Eye size={14} /> PRÉVIA AO VIVO
          </span>
          <span className="online" />
        </div>
        <div className="preview-phone">
          <ProfileView
            profile={{ ...profile, links: profile.links ?? [] }}
            preview
            pro={pro}
          />
        </div>
        <p>As alterações aparecem aqui antes de salvar.</p>
        {!demo && getValues("published") && initial.username && (
          <Link
            href={`/${initial.username}`}
            className="text-button"
            target="_blank"
          >
            Abrir página salva ↗
          </Link>
        )}
      </aside>
    </form>
  );
}
