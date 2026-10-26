"use client";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowUpRight,
  Gamepad2,
  Headphones,
  Play,
  Sparkles,
  Link2,
} from "lucide-react";
export function ProfileDemo({ compact = false }: { compact?: boolean }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      className={`profile-scene ${compact ? "compact" : ""}`}
    >
      {!compact && (
        <>
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <span className="float-tag tag-one">
            <Sparkles size={14} />
            100% sua vibe
          </span>
          <span className="float-tag tag-two">
            <span className="online" /> Feito pra se conectar
          </span>
          <span className="scene-star">✦</span>
        </>
      )}
      <div className="demo-card">
        <div className="demo-cover">
          <div className="cover-grid" />
          <span className="demo-label">
            <span className="online" /> perfil de demonstração
          </span>
          <div className="planet" />
        </div>
        <div className="demo-content">
          <div className="avatar">
            W<span>✦</span>
          </div>
          <span className="gamer-tag">PLAYER ONE</span>
          <h3>
            wendell <span>✧</span>
          </h3>
          <p className="demo-handle">@wendell</p>
          <p className="demo-bio">
            Entre um game e uma ideia nova.
            <br />
            Esse é o meu universo. 🪐
          </p>
          <div className="demo-interests">
            <span>
              <Gamepad2 size={12} />
              gamer
            </span>
            <span>
              <Headphones size={12} />
              music lover
            </span>
          </div>
          <div className="demo-links">
            {[
              [Gamepad2, "Meu servidor", "Bora jogar juntos"],
              [Play, "Meu canal", "Um pouco do meu mundo"],
              [Link2, "Todos os meus links", "Encontre sua próxima conexão"],
            ].map(([Icon, title, sub]) => {
              const I = Icon as typeof Gamepad2;
              return (
                <div className="demo-link" key={String(title)}>
                  <I size={19} />
                  <span>
                    <strong>{String(title)}</strong>
                    <small>{String(sub)}</small>
                  </span>
                  <ArrowUpRight size={16} />
                </div>
              );
            })}
          </div>
          <p className="demo-credit">
            feito com <strong>vibepage</strong> ✦
          </p>
        </div>
      </div>
    </motion.div>
  );
}
