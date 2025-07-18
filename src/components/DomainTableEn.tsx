import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Bell, BellOff, ArrowUpDown } from 'lucide-react';
import type { Domain } from '@/types/domain';

interface DomainTableEnProps {
  domains: Domain[];
  onToggleNotifications: (domainId: string) => void;
  onRefreshDomain: (domainId: string) => void;
}

const statusConfig = {
  normal: { label: '🟢 Normal', variant: 'success' as const },
  expiring: { label: '🟡 Expiring Soon', variant: 'warning' as const },
  expired: { label: '🔴 Expired', variant: 'error' as const },
  failed: { label: '⚪️ Query Failed', variant: 'secondary' as const },
  unregistered: { label: '🔵 Unregistered', variant: 'outline' as const },
};

export function DomainTableEn({ domains, onToggleNotifications, onRefreshDomain }: DomainTableEnProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof Domain>('expiresAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const filteredDomains = domains.filter(domain =>
    domain.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
    domain.registrar?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedDomains = [...filteredDomains].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (aValue === undefined || bValue === undefined) return 0;
    
    let comparison = 0;
    if (aValue < bValue) comparison = -1;
    if (aValue > bValue) comparison = 1;
    
    return sortDirection === 'desc' ? -comparison : comparison;
  });

  const handleSort = (field: keyof Domain) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return '-';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(date));
  };

  const formatRelativeTime = (date: Date | undefined) => {
    if (!date) return '-';
    const now = new Date();
    const target = new Date(date);
    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) {
      return `in ${diffDays} days`;
    } else if (diffDays === 0) {
      return 'today';
    } else {
      return `${Math.abs(diffDays)} days ago`;
    }
  };

  const getTimeAgo = (date: Date | undefined) => {
    if (!date) return '-';
    const now = new Date();
    const target = new Date(date);
    const diffTime = now.getTime() - target.getTime();
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `${diffDays} days ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hours ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minutes ago`;
    } else {
      return 'just now';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search domains or registrars..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('domain')}
              >
                <div className="flex items-center">
                  Domain
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>Registrar</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('expiresAt')}
              >
                <div className="flex items-center">
                  Expires At
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>DNS Provider</TableHead>
              <TableHead>Domain Status</TableHead>
              <TableHead>Status Badge</TableHead>
              <TableHead>Last Check</TableHead>
              <TableHead>Notifications</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedDomains.map((domain) => (
              <TableRow key={domain.id}>
                <TableCell className="font-medium">{domain.domain}</TableCell>
                <TableCell>{domain.registrar || '-'}</TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div>{formatDate(domain.expiresAt)}</div>
                    {domain.expiresAt && (
                      <div className="text-xs text-muted-foreground">
                        {formatRelativeTime(domain.expiresAt)}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{domain.dnsProvider || '-'}</TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {domain.domainStatus || '-'}
                </TableCell>
                <TableCell>
                  <Badge variant={statusConfig[domain.status].variant}>
                    {statusConfig[domain.status].label}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {getTimeAgo(domain.lastCheck)}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onToggleNotifications(domain.id)}
                  >
                    {domain.notifications ? (
                      <Bell className="h-4 w-4" />
                    ) : (
                      <BellOff className="h-4 w-4" />
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {sortedDomains.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          {searchTerm ? 'No matching domains found' : 'No domain data'}
        </div>
      )}
    </div>
  );
} 