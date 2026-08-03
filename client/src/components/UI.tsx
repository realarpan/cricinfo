import { motion } from 'framer-motion';
export function Skeleton({ className='' }: {className?:string}) { return <div className={`animate-pulse rounded bg-slate-200 dark:bg-slate-800 ${className}`}/> }
export function Section({title,children,action}:{title:string;children:React.ReactNode;action?:React.ReactNode}) { return <section className="mb-8"><div className="mb-3 flex items-center justify-between"><h2 className="text-xl font-extrabold">{title}</h2>{action}</div>{children}</section> }
export function ErrorMessage({message}:{message:string}) { return <div role="alert" className="card border-l-4 border-red-500 text-slate-600 dark:text-slate-300">{message}</div> }
export const Fade=({children}:{children:React.ReactNode})=><motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}>{children}</motion.div>;
