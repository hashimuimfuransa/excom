import React, { useState, useMemo } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Toolbar,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Menu,
  MenuItem,
  Checkbox,
  Box,
  Button,
  Chip,
  CircularProgress,
  Alert,
  useTheme
} from '@mui/material';
import {
  Search,
  MoreVert,
  FilterList,
  GetApp
} from '@mui/icons-material';
import { visuallyHidden } from '@mui/utils';

export interface Column {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'right' | 'left' | 'center';
  format?: (value: any, row?: any) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps {
  title?: string;
  columns: Column[];
  rows: any[];
  loading?: boolean;
  searchable?: boolean;
  selectable?: boolean;
  emptyMessage?: string;
  onRowAction?: (action: string, row: any) => void;
  onBulkAction?: (action: string, selectedRows: any[]) => void;
  rowActions?: Array<{
    label: string;
    action: string;
    icon?: React.ReactNode;
  }>;
  bulkActions?: Array<{
    label: string;
    action: string;
    icon?: React.ReactNode;
  }>;
}

type Order = 'asc' | 'desc';

export default function DataTable({
  title,
  columns,
  rows,
  loading = false,
  searchable = true,
  selectable = false,
  emptyMessage = 'No data available',
  onRowAction,
  onBulkAction,
  rowActions = [],
  bulkActions = []
}: DataTableProps) {
  const theme = useTheme();
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<string>('');
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [currentRow, setCurrentRow] = useState<any>(null);

  const handleRequestSort = (property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelecteds = filteredRows.map((row) => row._id || row.id);
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
  };

  const handleClick = (id: string) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected: string[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      );
    }

    setSelected(newSelected);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, row: any) => {
    setAnchorEl(event.currentTarget);
    setCurrentRow(row);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setCurrentRow(null);
  };

  const handleRowAction = (action: string) => {
    if (onRowAction && currentRow) {
      onRowAction(action, currentRow);
    }
    handleMenuClose();
  };

  const handleBulkAction = (action: string) => {
    if (onBulkAction && selected.length > 0) {
      const selectedRows = rows.filter(row => 
        selected.includes(row._id || row.id)
      );
      onBulkAction(action, selectedRows);
      setSelected([]);
    }
  };

  const isSelected = (id: string) => selected.indexOf(id) !== -1;

  // Filter rows based on search query
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return rows;

    return rows.filter(row =>
      columns.some(column => {
        const value = row[column.id];
        if (value == null) return false;
        
        return value.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
               (typeof value === 'object' && 
                Object.values(value).some(v => 
                  v?.toString().toLowerCase().includes(searchQuery.toLowerCase())
                ));
      })
    );
  }, [rows, searchQuery, columns]);

  // Sort filtered rows
  const sortedRows = useMemo(() => {
    if (!orderBy) return filteredRows;

    return [...filteredRows].sort((a, b) => {
      const aVal = a[orderBy];
      const bVal = b[orderBy];

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return order === 'asc' ? -1 : 1;
      if (bVal == null) return order === 'asc' ? 1 : -1;

      const aStr = aVal.toString().toLowerCase();
      const bStr = bVal.toString().toLowerCase();

      if (aStr < bStr) {
        return order === 'asc' ? -1 : 1;
      }
      if (aStr > bStr) {
        return order === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredRows, order, orderBy]);

  // Paginated rows
  const paginatedRows = sortedRows.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (loading) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading...</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ 
      width: '100%', 
      mb: 2, 
      borderRadius: 3, 
      overflow: 'hidden',
      background: theme.palette.mode === 'dark' 
        ? 'rgba(26, 31, 46, 0.8)' 
        : 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(10px)',
      border: 1,
      borderColor: 'divider'
    }}>
      <Toolbar
        sx={{
          pl: { sm: 2 },
          pr: { xs: 1, sm: 1 },
          ...(selected.length > 0 && {
            bgcolor: theme.palette.mode === 'dark' 
              ? 'rgba(25, 118, 210, 0.2)' 
              : 'rgba(25, 118, 210, 0.1)',
          }),
        }}
      >
        {selected.length > 0 ? (
          <>
            <Typography
              sx={{ flex: '1 1 100%' }}
              color="inherit"
              variant="subtitle1"
              component="div"
            >
              {selected.length} selected
            </Typography>
            
            {bulkActions.map((action, index) => (
              <Button
                key={index}
                startIcon={action.icon}
                onClick={() => handleBulkAction(action.action)}
                sx={{ ml: 1 }}
              >
                {action.label}
              </Button>
            ))}
          </>
        ) : (
          <>
            {title && (
              <Typography
                sx={{ flex: '1 1 100%' }}
                variant="h6"
                id="tableTitle"
                component="div"
                fontWeight={700}
              >
                {title}
              </Typography>
            )}
            
            {searchable && (
              <TextField
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
                sx={{ minWidth: 250, ml: 2 }}
              />
            )}
          </>
        )}
      </Toolbar>

      <TableContainer>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {selectable && (
                <TableCell padding="checkbox">
                  <Checkbox
                    color="primary"
                    indeterminate={selected.length > 0 && selected.length < filteredRows.length}
                    checked={filteredRows.length > 0 && selected.length === filteredRows.length}
                    onChange={handleSelectAllClick}
                  />
                </TableCell>
              )}
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  style={{ minWidth: column.minWidth }}
                  sortDirection={orderBy === column.id ? order : false}
                >
                  {column.sortable !== false ? (
                    <TableSortLabel
                      active={orderBy === column.id}
                      direction={orderBy === column.id ? order : 'asc'}
                      onClick={() => handleRequestSort(column.id)}
                    >
                      <Typography variant="subtitle2" fontWeight={700}>
                        {column.label}
                      </Typography>
                      {orderBy === column.id ? (
                        <Box component="span" sx={visuallyHidden}>
                          {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                        </Box>
                      ) : null}
                    </TableSortLabel>
                  ) : (
                    <Typography variant="subtitle2" fontWeight={700}>
                      {column.label}
                    </Typography>
                  )}
                </TableCell>
              ))}
              {rowActions.length > 0 && (
                <TableCell align="center">
                  <Typography variant="subtitle2" fontWeight={700}>
                    Actions
                  </Typography>
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedRows.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={columns.length + (selectable ? 1 : 0) + (rowActions.length > 0 ? 1 : 0)}
                  align="center"
                  sx={{ py: 6 }}
                >
                  <Typography variant="body1" color="text.secondary">
                    {emptyMessage}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedRows.map((row) => {
                const isItemSelected = isSelected(row._id || row.id);
                const labelId = `enhanced-table-checkbox-${row._id || row.id}`;

                return (
                  <TableRow
                    hover
                    role="checkbox"
                    aria-checked={isItemSelected}
                    tabIndex={-1}
                    key={row._id || row.id}
                    selected={isItemSelected}
                  >
                    {selectable && (
                      <TableCell padding="checkbox">
                        <Checkbox
                          color="primary"
                          checked={isItemSelected}
                          onChange={() => handleClick(row._id || row.id)}
                          inputProps={{ 'aria-labelledby': labelId }}
                        />
                      </TableCell>
                    )}
                    {columns.map((column) => {
                      const value = row[column.id];
                      return (
                        <TableCell key={column.id} align={column.align}>
                          {column.format ? column.format(value, row) : value}
                        </TableCell>
                      );
                    })}
                    {rowActions.length > 0 && (
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuClick(e, row)}
                        >
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={filteredRows.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {rowActions.map((action, index) => (
          <MenuItem 
            key={index} 
            onClick={() => handleRowAction(action.action)}
          >
            {action.icon && <Box sx={{ mr: 1, display: 'flex' }}>{action.icon}</Box>}
            {action.label}
          </MenuItem>
        ))}
      </Menu>
    </Paper>
  );
}