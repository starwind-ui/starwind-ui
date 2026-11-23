import Table from "./Table.svelte";
import TableBody from "./TableBody.svelte";
import TableCaption from "./TableCaption.svelte";
import TableCell from "./TableCell.svelte";
import TableFoot from "./TableFoot.svelte";
import TableHead from "./TableHead.svelte";
import TableHeader from "./TableHeader.svelte";
import TableRow from "./TableRow.svelte";
import {
  table,
  tableBody,
  tableCaption,
  tableCell,
  tableFoot,
  tableHead,
  tableHeader,
  tableRow,
} from "./variants.js";

export type { TableProps } from "./Table.svelte";
export type { TableBodyProps } from "./TableBody.svelte";
export type { TableCaptionProps } from "./TableCaption.svelte";
export type { TableCellProps } from "./TableCell.svelte";
export type { TableFootProps } from "./TableFoot.svelte";
export type { TableHeadProps } from "./TableHead.svelte";
export type { TableHeaderProps } from "./TableHeader.svelte";
export type { TableRowProps } from "./TableRow.svelte";

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
const TableParts = {
  Root: Table,
  Body: TableBody,
  Caption: TableCaption,
  Cell: TableCell,
  Foot: TableFoot,
  Head: TableHead,
  Header: TableHeader,
  Row: TableRow,
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
export default TableParts;
