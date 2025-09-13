import Table, { table } from "./Table.astro";
import TableBody, { tableBody } from "./TableBody.astro";
import TableCaption, { tableCaption } from "./TableCaption.astro";
import TableCell, { tableCell } from "./TableCell.astro";
import TableFoot, { tableFoot } from "./TableFoot.astro";
import TableHead, { tableHead } from "./TableHead.astro";
import TableHeader, { tableHeader } from "./TableHeader.astro";
import TableRow, { tableRow } from "./TableRow.astro";

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
