import './pcb.css';

/** Material Symbols Rounded, addressed by ligature name. */
export const Icon = ({ name, size = 20 }: { name: string; size?: number }) => (
  <span className="pcb-icon" style={{ fontSize: size }} aria-hidden="true">
    {name}
  </span>
);
