"use client";
import { StudioEditor } from "@/components/studio-editor";
import { loadDemo } from "@/lib/demo-state";
import { clientId } from "@/lib/client-id";
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
  Gamepad2,
  Sparkles,
  Settings2,
  ChartNoAxesCombined,
  Monitor,
  Smartphone,
} from "lucide-react";
import { GamerCardEditor } from "@/components/gamer-card-editor";
import {
  defaultEffects,
  backgroundEffects,
  avatarEffects,
  buttonEffects,
  entranceEffects,
} from "@/lib/customization";
import { applyTheme } from "@/lib/appearance";
import { ShareLink } from "@/components/share-link";
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
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [applyRecipe, setApplyRecipe] = useState(true);
  const [tab, setTab] = useState("identity");
  const [status, setStatus] = useState("");
  const [uploading, setUploading] = useState("");
  const [viewport, setViewport] = useState("mobile");
  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: initial,
  });
  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = form;
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "links",
    keyName: "fieldKey",
  });
  const profile = useWatch({ control }) as ProfileInput;
  useEffect(() => {
    if (!demo) return;
    try {
      reset(
        loadDemo(
          initial,
          localStorage.getItem("vibepage:demo"),
          new URLSearchParams(window.location.search).get("theme"),
        ),
      );
    } catch {}
  }, [demo, reset, initial]);
  useEffect(() => {
    function warn(e: BeforeUnloadEvent) {
      if (isDirty) {
        e.preventDefault();
      }
    }
    function navigate(event: MouseEvent) {
      const anchor = (event.target as Element)?.closest?.(
        "a[href]",
      ) as HTMLAnchorElement | null;
      if (
        !isDirty ||
        !anchor ||
        anchor.target === "_blank" ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        anchor.getAttribute("href")?.startsWith("#")
      )
        return;
      if (!window.confirm("Você tem alterações não salvas. Sair do editor?")) {
        event.preventDefault();
        event.stopPropagation();
      }
    }
    document.addEventListener("click", navigate, true);
    window.addEventListener("beforeunload", warn);
    return () => {
      window.removeEventListener("beforeunload", warn);
      document.removeEventListener("click", navigate, true);
    };
  }, [isDirty]);
  async function uploadGallery(file: File, index: number) {
    if (file.size > 4 * 1024 * 1024) {
      setStatus("Use uma imagem de até 4 MB.");
      return;
    }
    setUploading("gallery");
    setStatus("");
    try {
      const response = await fetch("/api/uploads/gallery", {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setValue(
        `blocks.${index}.imageKeys`,
        [...form.getValues(`blocks.${index}.imageKeys`), result.key],
        { shouldDirty: true },
      );
      setStatus("Imagem enviada. Salve o perfil para publicar.");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Falha no upload.");
    } finally {
      setUploading("");
    }
  }
  async function uploadCard(file: File, index: number) {
    if (file.size > 4 * 1024 * 1024) {
      setStatus("Use uma imagem de até 4 MB.");
      return;
    }
    setUploading("gamer-avatar");
    setStatus("");
    try {
      const response = await fetch("/api/uploads/gamer-avatar", {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setValue(`gamerCards.${index}.avatarKey`, result.key, {
        shouldDirty: true,
      });
      setStatus("Avatar enviado. Salve para aplicar ao cartão.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Falha no upload.");
    } finally {
      setUploading("");
    }
  }
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
      <fieldset
        className="editor-controls"
        disabled={isSubmitting || !!uploading}
      >
        <div className="editor-tabs" role="group" aria-label="Seções do editor">
          {[
            ["identity", UserRound, "Perfil"],
            ["links", Link2, "Links"],
            ["cards", Gamepad2, "Cartões"],
            ["studio", Palette, "Studio 3.0"],
            ["themes", Palette, "Temas"],
            ["style", Palette, "Aparência"],
            ["effects", Sparkles, "Efeitos"],
            ["stats", ChartNoAxesCombined, "Estatísticas"],
            ["settings", Settings2, "Configurações"],
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
                {id === "studio" && (errors.blocks || errors.studio) && (
                  <span className="tab-error">!</span>
                )}
                {id === "cards" && errors.gamerCards && (
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
                  aria-invalid={!!errors.displayName}
                  aria-describedby={
                    errors.displayName ? "profile-name-error" : undefined
                  }
                  maxLength={60}
                  placeholder="Como você quer aparecer?"
                />
                {errors.displayName && (
                  <span className="field-error" id="profile-name-error">
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
                    aria-invalid={!!errors.username}
                    aria-describedby={
                      errors.username ? "profile-username-error" : undefined
                    }
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
                  <span className="field-error" id="profile-username-error">
                    Escolha um username válido e disponível.
                  </span>
                )}
              </label>
              <label>
                Biografia
                <textarea
                  {...register("bio")}
                  aria-invalid={!!errors.bio}
                  aria-describedby={
                    errors.bio ? "profile-bio-error" : undefined
                  }
                  maxLength={240}
                  rows={4}
                  placeholder="O que faz parte da sua vibe?"
                />
                <small>{profile.bio?.length || 0}/240</small>
                {errors.bio && (
                  <span className="field-error" id="profile-bio-error">
                    {errors.bio.message}
                  </span>
                )}
              </label>
              <div className="upload-grid">
                {(["avatar", "background"] as const).map((kind) => (
                  <div className="upload-box" key={kind}>
                    <Upload size={19} />
                    <strong>
                      {kind === "avatar" ? "Avatar" : "Imagem de fundo · Pro"}
                    </strong>
                    <label className="upload-label">
                      {uploading === kind ? "Enviando…" : "Escolher imagem"}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        disabled={
                          !!uploading || demo || (kind === "background" && !pro)
                        }
                        onChange={(e) => {
                          void upload(kind, e.target.files?.[0]);
                          e.currentTarget.value = "";
                        }}
                      />
                    </label>
                    <small>
                      {demo
                        ? "Uploads disponíveis no aplicativo com conta."
                        : kind === "background" && !pro
                          ? "Disponível no plano Pro."
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
                onClick={() => append({ id: clientId(), title: "", url: "" })}
              >
                <Plus size={17} /> Adicionar link
              </button>
            </div>
          )}
          {tab === "studio" && (
            <StudioEditor
              form={form}
              profile={profile}
              pro={pro}
              demo={demo}
              uploadGallery={uploadGallery}
            />
          )}
          {tab === "cards" && (
            <GamerCardEditor
              form={form}
              pro={pro}
              demo={demo}
              upload={uploadCard}
              onSelect={setSelectedCard}
            />
          )}
          {tab === "effects" && (
            <div className="editor-fields">
              <div>
                <p className="kicker">FAÇA SUA VIBE SE MOVER</p>
                <h2>Efeitos com personalidade.</h2>
                <p className="panel-description">
                  Todos os efeitos respeitam movimento reduzido e podem ser
                  pausados no perfil.
                </p>
              </div>
              {!pro && (
                <p>
                  Fundos, avatares e botões animados exigem Pro. Fade e entrada
                  estática são gratuitos.
                </p>
              )}
              <label>
                Fundo
                <select {...register("backgroundEffect")} disabled={!pro}>
                  {backgroundEffects.map((v, i) => (
                    <option key={v} value={v}>
                      {
                        [
                          "Desativado",
                          "Partículas luminosas",
                          "Estrelas",
                          "Gradiente em movimento",
                          "Aurora",
                          "Chuva digital",
                          "Nebulosa",
                          "Ondas de luz",
                          "Parallax suave",
                        ][i]
                      }
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Avatar
                <select {...register("avatarEffect")} disabled={!pro}>
                  {avatarEffects.map((v, i) => (
                    <option key={v} value={v}>
                      {
                        [
                          "Desativado",
                          "Neon pulsante",
                          "Halo",
                          "Anel animado",
                          "Holográfico",
                          "Destaque no hover",
                        ][i]
                      }
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Botões
                <select {...register("buttonEffect")} disabled={!pro}>
                  {buttonEffects.map((v, i) => (
                    <option key={v} value={v}>
                      {
                        [
                          "Desativado",
                          "Neon glow",
                          "Hover magnético",
                          "Gradiente animado",
                          "Glass",
                          "Brilho no hover",
                          "Pressionar",
                        ][i]
                      }
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Entrada
                <select {...register("entranceEffect")}>
                  {entranceEffects.map((v, i) => (
                    <option
                      key={v}
                      value={v}
                      disabled={!pro && !["none", "fade"].includes(v)}
                    >
                      {
                        [
                          "Sem animação",
                          "Fade in",
                          "Slide up · Pro",
                          "Zoom · Pro",
                          "Sequência · Pro",
                        ][i]
                      }
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
          {tab === "stats" && (
            <div className="editor-fields">
              <h2>O alcance da sua vibe.</h2>
              <p>
                Visitas agregadas, sem rastrear visitantes. As estatísticas usam
                a página salva.
              </p>
              {demo ? (
                <p>A demonstração não gera métricas.</p>
              ) : (
                <Link
                  className="button button-secondary"
                  href="/dashboard/estatisticas"
                >
                  Abrir estatísticas reais
                </Link>
              )}
            </div>
          )}
          {tab === "settings" && (
            <div className="editor-fields">
              <h2>Seu perfil, sob seu controle.</h2>
              {!demo && initial.username && (
                <ShareLink username={initial.username} />
              )}
              <p>
                A publicação é aplicada ao salvar. Desmarque Perfil público
                abaixo para retirar a página do ar.
              </p>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => {
                  if (
                    !window.confirm(
                      "Redefinir cores, tema, fonte e efeitos? Links, cartões e identidade serão preservados.",
                    )
                  )
                    return;
                  for (const [key, value] of Object.entries({
                    ...defaultEffects,
                    themeId: "midnight-purple",
                    accentColor: "#a78bfa",
                    backgroundColor: "#100c1b",
                    buttonStyle: "soft",
                    animation: "none",
                    hideBranding: false,
                  }))
                    setValue(key as keyof ProfileInput, value as never, {
                      shouldDirty: true,
                    });
                  setStatus("Aparência redefinida. Salve para aplicar.");
                }}
              >
                Redefinir aparência
              </button>
              {!demo && (
                <Link className="text-button" href="/dashboard/conta">
                  Privacidade, exportação e exclusão da conta →
                </Link>
              )}
            </div>
          )}
          {tab === "themes" && (
            <div className="editor-fields">
              <div>
                <p className="kicker">ESCOLHA SUA ATMOSFERA</p>
                <h2>O seu estilo começa aqui.</h2>
              </div>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={applyRecipe}
                  onChange={(event) => setApplyRecipe(event.target.checked)}
                />{" "}
                Aplicar também fonte, botões, cartões e efeitos do tema
              </label>
              <p className="panel-description">
                Desmarque para trocar apenas a paleta e preservar suas escolhas
                de efeitos.
              </p>
              <div className="theme-picker">
                {themes.map((theme) => (
                  <button
                    className={profile.themeId === theme.id ? "selected" : ""}
                    aria-pressed={profile.themeId === theme.id}
                    key={theme.id}
                    type="button"
                    disabled={theme.premium && !pro}
                    onClick={() => {
                      const selected = applyTheme(
                        profile,
                        theme.id,
                        applyRecipe,
                      );
                      for (const key of [
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
                        setValue(key, selected[key] as never, {
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
            </div>
          )}
          {tab === "style" && (
            <div className="editor-fields">
              <div>
                <p className="kicker">AJUSTES DA SUA VIBE</p>
                <h2>Detalhes que fazem diferença.</h2>
              </div>
              <label>
                Tipografia
                <select {...register("fontFamily")} disabled={!pro}>
                  <option value="modern">Moderna · sistema</option>
                  <option value="mono">Monoespaçada · Pro</option>
                  <option value="rounded">Arredondada · Pro</option>
                </select>
                <small>
                  Fontes locais do dispositivo. Sem downloads externos.
                </small>
              </label>
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
      </fieldset>
      <aside className={`editor-preview preview-${viewport}`}>
        <div className="preview-heading">
          <span>
            <Eye size={14} /> PRÉVIA AO VIVO
          </span>
          <span className="online" />
        </div>
        <div
          className="viewport-switch"
          role="group"
          aria-label="Tamanho da prévia"
        >
          <button
            type="button"
            aria-pressed={viewport === "mobile"}
            onClick={() => setViewport("mobile")}
          >
            <Smartphone size={15} />
            Mobile
          </button>
          <button
            type="button"
            aria-pressed={viewport === "desktop"}
            onClick={() => setViewport("desktop")}
          >
            <Monitor size={15} />
            Desktop
          </button>
        </div>
        <div className="preview-phone">
          <ProfileView
            profile={{
              ...profile,
              links: profile.links ?? [],
              gamerCards: profile.gamerCards ?? [],
            }}
            preview
            pro={pro}
            selectedCardId={selectedCard}
          />
        </div>
        <p>As alterações aparecem aqui antes de salvar.</p>
        {!demo && initial.published && initial.username && (
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
