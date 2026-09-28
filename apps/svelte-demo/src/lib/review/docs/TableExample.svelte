<script lang="ts">
  import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFoot,
    TableHead,
    TableHeader,
    TableRow,
  } from "$lib/starwind-runtime/table";
</script>

<Table class="max-w-md mx-auto">
  <TableCaption>Example of a simple table</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Email</TableHead>
      <TableHead>Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Ada Lovelace</TableCell>
      <TableCell>ada@starwind.dev</TableCell>
      <TableCell>Active</TableCell>
    </TableRow>
    <TableRow>
      <TableCell>Grace Hopper</TableCell>
      <TableCell>grace@starwind.dev</TableCell>
      <TableCell>Inactive</TableCell>
    </TableRow>
  </TableBody>
  <TableFoot>
    <TableRow>
      <TableCell colspan={3}>Total: 2 users</TableCell>
    </TableRow>
  </TableFoot>
</Table>
