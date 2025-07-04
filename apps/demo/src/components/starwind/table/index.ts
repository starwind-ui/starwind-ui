import Table from "./Table.astro";
import TableBody from "./TableBody.astro";
import TableCaption from "./TableCaption.astro";
import TableCell from "./TableCell.astro";
import TableFoot from "./TableFoot.astro";
import TableHead from "./TableHead.astro";
import TableHeader from "./TableHeader.astro";
import TableRow from "./TableRow.astro";

export { Table, TableBody, TableCaption, TableCell, TableFoot, TableHead, TableHeader, TableRow };

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
