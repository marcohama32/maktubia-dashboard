import React from "react";
import { DocIcon } from "./icons/DocIcon";
import { HomeIcon } from "./icons/HomeIcon";
import { EstablishmentIcon } from "./icons/EstablishmentIcon";
import { UserIcon } from "./icons/UserIcon";
import { CustomerIcon } from "./icons/CustomerIcon";
import { PurchaseIcon } from "./icons/PurchaseIcon";
import { TransferIcon } from "./icons/TransferIcon";

export interface SidebarItem {
  title: string;
  icon: string; // Nome do componente do ícone
  link: string;
}

export const sidebarItems: SidebarItem[] = [
  {
    title: "Dashboard",
    icon: "HomeIcon",
    link: "/",
  },
  {
    title: "Meu Dashboard",
    icon: "HomeIcon",
    link: "/merchant/dashboard",
  },
  {
    title: "Estabelecimentos",
    icon: "EstablishmentIcon",
    link: "/admin/establishments",
  },
  {
    title: "Usuários",
    icon: "UserIcon",
    link: "/admin/users",
  },
  {
    title: "Clientes",
    icon: "CustomerIcon",
    link: "/admin/customers",
  },
  {
    title: "Merchants",
    icon: "UserIcon",
    link: "/admin/merchants",
  },
  {
    title: "Campanhas",
    icon: "PurchaseIcon",
    link: "/admin/campaigns",
  },
  {
    title: "Campanhas Públicas",
    icon: "PurchaseIcon",
    link: "/merchant/campaigns/public",
  },
  {
    title: "Minhas Campanhas",
    icon: "PurchaseIcon",
    link: "/merchant/campaigns/my",
  },
  {
    title: "Compras",
    icon: "PurchaseIcon",
    link: "/admin/purchases",
  },
  {
    title: "Resgates",
    icon: "PurchaseIcon",
    link: "/admin/redemptions",
  },
  {
    title: "Pontos",
    icon: "PurchaseIcon",
    link: "/admin/points",
  },
  {
    title: "Transferências",
    icon: "TransferIcon",
    link: "/admin/transfers",
  },
  {
    title: "Guia de Uso",
    icon: "DocIcon",
    link: "/admin/documentation",
  },
];

// Mapa de ícones - garantir que todos estão definidos
// Verificar se todos os ícones foram importados corretamente
const iconMapInternal: Record<string, React.ComponentType<any>> = {};

// Verificar cada ícone individualmente
if (DocIcon) iconMapInternal.DocIcon = DocIcon;
if (HomeIcon) iconMapInternal.HomeIcon = HomeIcon;
if (EstablishmentIcon) iconMapInternal.EstablishmentIcon = EstablishmentIcon;
if (UserIcon) iconMapInternal.UserIcon = UserIcon;
if (CustomerIcon) iconMapInternal.CustomerIcon = CustomerIcon;
if (PurchaseIcon) iconMapInternal.PurchaseIcon = PurchaseIcon;
if (TransferIcon) iconMapInternal.TransferIcon = TransferIcon;

export const iconMap = iconMapInternal;

// Função para obter dados do sidebar (sem renderizar ícones)
export function getSidebarData() {
  return sidebarItems;
}
