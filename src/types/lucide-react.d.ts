declare module "lucide-react" {
  import type { FC, SVGAttributes } from "react";
  interface LucideProps extends SVGAttributes<SVGSVGElement> {
    size?: number;
    color?: string;
    strokeWidth?: number;
  }
  type Icon = FC<LucideProps>;
  export const ArrowLeft: Icon;
  export const Building2: Icon;
  export const Calendar: Icon;
  export const Camera: Icon;
  export const Download: Icon;
  export const Eye: Icon;
  export const FileText: Icon;
  export const Hammer: Icon;
  export const LayoutDashboard: Icon;
  export const Loader2: Icon;
  export const LogIn: Icon;
  export const LogOut: Icon;
  export const MapPin: Icon;
  export const Plus: Icon;
  export const Save: Icon;
  export const Shield: Icon;
  export const Trash2: Icon;
  export const User: Icon;
  export const UserPlus: Icon;
  export const Wrench: Icon;
  export const X: Icon;
}
