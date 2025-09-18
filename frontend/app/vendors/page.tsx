"use client";
import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Box,
  Stack,
  Avatar,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Button,
  Paper,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  Store as StoreIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { apiGet } from '@utils/api';
import NextLink from 'next/link';

interface Store {
  _id: string;
  name: string;
  description?: string;
  logo?: string;
  banner?: string;
  category?: string;
  owner?: { name: string; email: string };
  createdAt?: string;
}

interface StoresResponse {
  stores: Store[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const categories = [
  'All Categories',
  'Electronics',
  'Fashion', 
  'Home & Garden',
  'Sports & Outdoors',
  'Books',
  'Toys & Games',
  'Health & Beauty',
  'Food & Beverages',
  'Arts & Crafts',
  'Automotive',
  'Other'
];

export default function VendorsPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All Categories');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  });

  const fetchStores = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12'
      });
      
      if (search.trim()) params.append('search', search.trim());
      if (category !== 'All Categories') params.append('category', category);
      
      const response = await apiGet<StoresResponse>(`/sellers/public/stores?${params}`);
      setStores(response.stores);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to fetch stores:', error);
      setStores([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, [page, search, category]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchStores();
  };

  const StoreCard = ({ store }: { store: Store }) => (
    <Card 
      sx={{ 
        height: '100%',
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
          borderColor: 'primary.main'
        }
      }}
    >
      {/* Banner Image */}
      {store.banner && (
        <CardMedia
          component="img"
          height="120"
          image={store.banner}
          alt={`${store.name} banner`}
          sx={{ objectFit: 'cover' }}
        />
      )}
      
      <CardContent>
        <Stack spacing={2}>
          {/* Store Header */}
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar 
              sx={{ 
                width: 48, 
                height: 48,
                bgcolor: 'primary.main'
              }}
            >
              {store.logo ? (
                <Box 
                  component="img" 
                  src={store.logo} 
                  alt={store.name}
                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <StoreIcon />
              )}
            </Avatar>
            <Box flex={1}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                {store.name}
              </Typography>
              {store.category && (
                <Chip 
                  label={store.category}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}
            </Box>
          </Stack>

          {/* Description */}
          {store.description && (
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {store.description}
            </Typography>
          )}

          {/* Owner Info */}
          {store.owner && (
            <Stack direction="row" alignItems="center" spacing={1}>
              <PersonIcon fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                By {store.owner.name}
              </Typography>
            </Stack>
          )}

          {/* Actions */}
          <Button
            component={NextLink}
            href={`/vendors/${store._id}`}
            variant="contained"
            fullWidth
            sx={{ borderRadius: 2, mt: 'auto' }}
          >
            View Store
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Stack spacing={3} mb={4}>
        <Box textAlign="center">
          <Typography variant="h3" fontWeight={900} gutterBottom>
            Our Vendors
          </Typography>
          <Typography variant="h6" color="text.secondary" maxWidth="600px" mx="auto">
            Discover amazing stores from our trusted vendors. Shop from a diverse range of categories and find exactly what you're looking for.
          </Typography>
        </Box>

        {/* Filters */}
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={2} 
            alignItems="center"
          >
            <Box component="form" onSubmit={handleSearchSubmit} sx={{ flex: 1 }}>
              <TextField
                fullWidth
                placeholder="Search stores..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton type="submit" size="small">
                        <SearchIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 2 }
                }}
              />
            </Box>
            
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={category}
                label="Category"
                onChange={(e) => setCategory(e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Paper>
      </Stack>

      {loading ? (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary">
            Loading stores...
          </Typography>
        </Box>
      ) : stores.length === 0 ? (
        <Box textAlign="center" py={8}>
          <Avatar sx={{ mx: 'auto', mb: 2, bgcolor: 'grey.100', width: 64, height: 64 }}>
            <StoreIcon fontSize="large" color="action" />
          </Avatar>
          <Typography variant="h6" gutterBottom>
            No stores found
          </Typography>
          <Typography color="text.secondary">
            Try adjusting your search or filters to find more stores.
          </Typography>
        </Box>
      ) : (
        <>
          {/* Results Header */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6" color="text.secondary">
              {pagination.total} store{pagination.total !== 1 ? 's' : ''} found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Page {pagination.page} of {pagination.pages}
            </Typography>
          </Stack>

          {/* Store Grid */}
          <Grid container spacing={3}>
            {stores.map((store) => (
              <Grid item xs={12} sm={6} md={4} key={store._id}>
                <StoreCard store={store} />
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination
                count={pagination.pages}
                page={pagination.page}
                onChange={(_, value) => setPage(value)}
                color="primary"
                size="large"
                sx={{ '& .MuiPaginationItem-root': { borderRadius: 2 } }}
              />
            </Box>
          )}
        </>
      )}
    </Container>
  );
}