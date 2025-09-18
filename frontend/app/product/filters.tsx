"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { Box, Slider, Typography, FormControlLabel, Checkbox, Stack, Chip } from '@mui/material';

export type Filters = {
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  categories?: string[];
};

type Props = {
  products: { category?: string; price: number }[];
  onChange: (f: Filters) => void;
};

export default function ProductFilters({ products, onChange }: Props) {
  const prices = products.map(p => p.price);
  const [range, setRange] = useState<[number, number]>([Math.min(...prices, 0), Math.max(...prices, 1000)]);
  const [rating, setRating] = useState<number | undefined>(undefined);
  const categories = useMemo(() => Array.from(new Set(products.map(p => p.category).filter(Boolean))) as string[], [products]);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    onChange({ minPrice: range[0], maxPrice: range[1], rating, categories: Object.keys(checked).filter(k => checked[k]) });
  }, [range, rating, checked]);

  return (
    <Box>
      <Typography fontWeight={700} mb={1}>Filters</Typography>

      <Typography variant="body2" color="text.secondary">Price</Typography>
      <Slider value={range} onChange={(_, v) => setRange(v as [number, number])} valueLabelDisplay="auto" min={0} max={Math.max(1000, range[1])} sx={{ mt: 1 }} />
      <Stack direction="row" spacing={1} mb={2}>
        <Chip label={`Min: $${range[0]}`} size="small" />
        <Chip label={`Max: $${range[1]}`} size="small" />
      </Stack>

      <Typography variant="body2" color="text.secondary">Rating</Typography>
      <Stack direction="row" spacing={1} mb={2}>
        {[4, 4.5, 5].map((r) => (
          <Chip key={r} label={`${r}+`} clickable color={rating === r ? 'primary' : 'default'} onClick={() => setRating(rating === r ? undefined : r)} />
        ))}
      </Stack>

      <Typography variant="body2" color="text.secondary">Category</Typography>
      <Stack>
        {categories.map((c) => (
          <FormControlLabel key={c} control={<Checkbox checked={!!checked[c]} onChange={(_, v) => setChecked(prev => ({ ...prev, [c]: v }))} />} label={c} />
        ))}
      </Stack>
    </Box>
  );
}