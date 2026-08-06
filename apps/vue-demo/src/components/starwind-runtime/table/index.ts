import Table from "./Table.vue";
import TableBody from "./TableBody.vue";
import TableCaption from "./TableCaption.vue";
import TableCell from "./TableCell.vue";
import TableFoot from "./TableFoot.vue";
import TableHead from "./TableHead.vue";
import TableHeader from "./TableHeader.vue";
import TableRow from "./TableRow.vue";
import {
  table,
  tableBody,
  tableCaption,
  tableCell,
  tableFoot,
  tableHead,
  tableHeader,
  tableRow,
} from "./variants";

export type { TableProps } from "./Table.vue";
export type { TableBodyProps } from "./TableBody.vue";
export type { TableCaptionProps } from "./TableCaption.vue";
export type { TableCellProps } from "./TableCell.vue";
export type { TableFootProps } from "./TableFoot.vue";
export type { TableHeadProps } from "./TableHead.vue";
export type { TableHeaderProps } from "./TableHeader.vue";
export type { TableRowProps } from "./TableRow.vue";

const TableVariants = {
  table,
  tableBody,
  tableCaption,
  tableCell,
  tableFoot,
  tableHead,
  tableHeader,
  tableRow,
};

export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFoot,
  TableHead,
  TableHeader,
  TableRow,
  TableVariants,
};

export default {
  Root: Table,
  Body: TableBody,
  Caption: TableCaption,
  Cell: TableCell,
  Foot: TableFoot,
  Head: TableHead,
  Header: TableHeader,
  Row: TableRow,
};
