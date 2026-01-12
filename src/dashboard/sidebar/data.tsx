import React from "react";
import { DocIcon } from "./icons/DocIcon";
import { HomeIcon } from "./icons/HomeIcon";
import { EstablishmentIcon } from "./icons/EstablishmentIcon";
import { UserIcon } from "./icons/UserIcon";
import { CustomerIcon } from "./icons/CustomerIcon";
import { PurchaseIcon } from "./icons/PurchaseIcon";
import { TransferIcon } from "./icons/TransferIcon";
import { PointsIcon } from "./icons/PointsIcon";
import { PointsManagementIcon } from "./icons/PointsManagementIcon";
import { RedemptionIcon } from "./icons/RedemptionIcon";

export interface SidebarItem {
  title: string;
  icon: string; // Nome do componente do ícone
  link: string;
  children?: SidebarItem[]; // Submenu items
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
    title: "Merchants",
    icon: "UserIcon",
    link: "/admin/merchants",
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
    title: "Pontos",
    icon: "PointsIcon",
    link: "#",
    children: [
      {
        title: "Gestão Pontos",
        icon: "PointsManagementIcon",
        link: "/admin/points",
      },
      {
        title: "Resgates",
        icon: "RedemptionIcon",
        link: "/admin/redemptions",
      },
      {
        title: "Transferências",
        icon: "TransferIcon",
        link: "/admin/transfers",
      },
    ],
  },
  {
    title: "Estabelecimentos",
    icon: "EstablishmentIcon",
    link: "/admin/establishments",
  },
  {
    title: "BCI",
    icon: "PurchaseIcon",
    link: "/admin/bci",
  },
  {
    title: "Compras",
    icon: "PurchaseIcon",
    link: "/admin/purchases",
  },
  {
    title: "Guia de Uso",
    icon: "DocIcon",
    link: "/admin/documentation",
  },
  {
    title: "Sair",
    icon: "UserIcon",
    link: "/logout",
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
if (PointsIcon) iconMapInternal.PointsIcon = PointsIcon;
if (PointsManagementIcon) iconMapInternal.PointsManagementIcon = PointsManagementIcon;
if (RedemptionIcon) iconMapInternal.RedemptionIcon = RedemptionIcon;

export const iconMap = iconMapInternal;

// Função para obter dados do sidebar (sem renderizar ícones)
export function getSidebarData() {
  return sidebarItems;
}
