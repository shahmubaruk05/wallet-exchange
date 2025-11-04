import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { transactions, type Transaction, type TransactionStatus } from "@/lib/data";
import PaymentIcon from "@/components/PaymentIcons";
import { format, parseISO } from 'date-fns';

const getStatusVariant = (status: TransactionStatus) => {
  switch (status) {
    case 'Completed':
      return 'bg-accent/20 text-accent-foreground hover:bg-accent/30';
    case 'Processing':
      return 'default';
    case 'Paid':
      return 'secondary';
    default:
      return 'outline';
  }
};

const AdminPage = () => {
  const allTransactions: Transaction[] = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Transaction History</h1>
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Send</TableHead>
                <TableHead>Receive</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allTransactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="font-medium">{format(parseISO(tx.date), 'PPp')}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                       <PaymentIcon id={tx.sendMethod.toLowerCase()} className="h-5 w-5"/>
                       <span>{tx.sendMethod}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                     <div className="flex items-center gap-2">
                       <PaymentIcon id={tx.receiveMethod.toLowerCase()} className="h-5 w-5"/>
                       <span>{tx.receiveMethod}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="font-mono">
                      {tx.sendAmount.toFixed(2)} {tx.sendCurrency} &rarr; {tx.receiveAmount.toFixed(2)} {tx.receiveCurrency}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={getStatusVariant(tx.status)}>{tx.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPage;
