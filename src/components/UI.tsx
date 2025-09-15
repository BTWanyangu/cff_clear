// src/components/UI.tsx
import React from "react";

// export function Card({ title, children }: { title?: string;  children: React.ReactNode }) {
//   return (
//     <div className="glass p-6">
//       {title && (
//         <div className="mb-4">
//           <h3 className="text-lg font-semibold text-amber-300">{title}</h3>
          
//         </div>
//       )}
//       <div>{children}</div>
//     </div>
//   );
// }

export function Card({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`glass p-6 ${className}`}>
      {title && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-amber-300">{title}</h3>
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}

export function Input({ label, ...props }: any) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-neutral-300">{label}</span>
      <input className="rounded-xl border border-neutral-700 bg-transparent px-3 py-2 outline-none" {...props} />
    </label>
  );
}

export function Select({ label, children, ...props }: any) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-neutral-300">{label}</span>
      <select className="rounded-xl border border-neutral-700 bg-transparent px-3 py-2 outline-none" {...props}>
        {children}
      </select>
    </label>
  );
}

export function Button({ children, className = "", ...props }: any) {
  return (
    <button
      {...props}
      className={
        "rounded-2xl px-4 py-2 font-medium bg-amber-400 text-black hover:opacity-95 disabled:opacity-60 " +
        className
      }
    >
      {children}
    </button>
  );
}
