import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Link2, TrendingUp, Shield, Clock } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

const BlockchainLedger = () => {
  const navigate = useNavigate();
  const { transactions } = useApp();

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'earned':
        return <TrendingUp className="w-4 h-4 text-primary" />;
      case 'verified':
        return <Shield className="w-4 h-4 text-success" />;
      case 'purchased':
        return <Link2 className="w-4 h-4 text-secondary" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case 'earned':
        return <Badge variant="outline" className="text-primary border-primary">Credits Earned</Badge>;
      case 'verified':
        return <Badge className="bg-success text-success-foreground">Verified</Badge>;
      case 'purchased':
        return <Badge variant="secondary">Purchased</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const totalTransactions = transactions.length;
  const totalCreditsTransacted = transactions.reduce((sum, tx) => sum + tx.credits, 0);
  const uniqueParticipants = new Set([
    ...transactions.map(tx => tx.ngoId),
    ...transactions.filter(tx => tx.buyerId).map(tx => tx.buyerId!)
  ]).size;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/5">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-sm shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link2 className="h-8 w-8 text-primary mr-3" />
              <div>
                <h1 className="text-2xl font-bold">Blockchain Ledger</h1>
                <p className="text-sm text-muted-foreground">Transparent carbon credit transaction history</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-card/60 backdrop-blur-sm border-0 shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{totalTransactions}</div>
              <p className="text-xs text-muted-foreground mt-1">Recorded on blockchain</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card/60 backdrop-blur-sm border-0 shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Credits Transacted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">{totalCreditsTransacted.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Total CO₂ tons</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card/60 backdrop-blur-sm border-0 shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Participants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-secondary">{uniqueParticipants}</div>
              <p className="text-xs text-muted-foreground mt-1">NGOs & Buyers</p>
            </CardContent>
          </Card>
        </div>

        {/* Blockchain Transactions */}
        <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2 text-primary" />
              Transaction History
            </CardTitle>
            <CardDescription>
              Immutable record of all carbon credit transactions on the blockchain
            </CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <Link2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">No Transactions Yet</h3>
                <p className="text-sm text-muted-foreground">
                  Transaction history will appear here as credits are earned and traded.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Transaction Hash</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Credits</TableHead>
                        <TableHead>Participant</TableHead>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions
                        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                        .map((transaction) => (
                        <TableRow key={transaction.id} className="hover:bg-muted/50">
                          <TableCell className="font-mono text-sm">
                            <div className="flex items-center">
                              {getTransactionIcon(transaction.type)}
                              <span className="ml-2 truncate max-w-[200px]">
                                {transaction.blockchainHash}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getTransactionBadge(transaction.type)}
                          </TableCell>
                          <TableCell className="font-bold text-primary">
                            {transaction.credits.toFixed(2)} tons
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="text-sm">NGO: {transaction.ngoId}</div>
                              {transaction.buyerId && (
                                <div className="text-xs text-muted-foreground">
                                  Buyer: {transaction.buyerId}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {transaction.timestamp.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-success border-success">
                              Confirmed
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-8 p-4 bg-muted/30 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2 flex items-center">
                    <Shield className="w-4 h-4 mr-2 text-primary" />
                    Blockchain Security Features
                  </h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Immutable transaction records with cryptographic hashes</li>
                    <li>• Decentralized verification across multiple nodes</li>
                    <li>• Real-time transparency for all participants</li>
                    <li>• Tamper-evident audit trail for regulatory compliance</li>
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BlockchainLedger;