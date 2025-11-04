import { DocIcon } from "./icons/DocIcon";
import { HomeIcon } from "./icons/HomeIcon";
import { EstablishmentIcon } from "./icons/EstablishmentIcon";
import { UserIcon } from "./icons/UserIcon";
import { CustomerIcon } from "./icons/CustomerIcon";
import { PurchaseIcon } from "./icons/PurchaseIcon";
import { FriendsIcon } from "./icons/FriendsIcon";
import { TransferIcon } from "./icons/TransferIcon";

export const data = [
  {
    title: "Dashboard",
    icon: <HomeIcon />,
    link: "/",
  },
  {
    title: "Estabelecimentos",
    icon: <EstablishmentIcon />,
    link: "/admin/establishments",
  },
  {
    title: "Usuários",
    icon: <UserIcon />,
    link: "/admin/users",
  },
  {
    title: "Clientes",
    icon: <CustomerIcon />,
    link: "/admin/customers",
  },
  {
    title: "Compras",
    icon: <PurchaseIcon />,
    link: "/admin/purchases",
  },
  {
    title: "Maktubia Friends",
    icon: <FriendsIcon />,
    link: "/admin/friends",
  },
  {
    title: "Transferências",
    icon: <TransferIcon />,
    link: "/admin/transfers",
  },
  {
    title: "Guia de Uso",
    icon: <DocIcon />,
    link: "/admin/documentation",
  },
];
