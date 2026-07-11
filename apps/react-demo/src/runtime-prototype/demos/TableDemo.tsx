import {
  Badge,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFoot,
  TableHead,
  TableHeader,
  TableRow,
} from "../kit";

export function TableDemo() {
  return (
    <section className="space-y-4" id="runtime-table-demo">
      <h2 className="font-heading text-xl font-semibold">Table</h2>
      <Table id="runtime-table-invoices">
        <TableCaption>A list of your recent invoices</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Method</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow id="runtime-table-selected-row" data-state="selected">
            <TableCell>INV001</TableCell>
            <TableCell>
              <Badge>Paid</Badge>
            </TableCell>
            <TableCell>Credit Card</TableCell>
            <TableCell className="text-right">$250.00</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>INV002</TableCell>
            <TableCell>
              <Badge variant="outline">Pending</Badge>
            </TableCell>
            <TableCell>PayPal</TableCell>
            <TableCell className="text-right">$150.00</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>INV003</TableCell>
            <TableCell>
              <Badge variant="error">Overdue</Badge>
            </TableCell>
            <TableCell>Bank Transfer</TableCell>
            <TableCell className="text-right">$350.00</TableCell>
          </TableRow>
        </TableBody>
        <TableFoot>
          <TableRow>
            <TableCell colSpan={3}>Total</TableCell>
            <TableCell className="text-right">$750.00</TableCell>
          </TableRow>
        </TableFoot>
      </Table>
    </section>
  );
}
