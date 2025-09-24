"use client";
import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Stack,
  Typography,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  Upload as UploadIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  AutoAwesome as AIIcon,
  CloudUpload as CloudUploadIcon,
  Close as CloseIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@utils/auth';

interface Product3DManagerProps {
  productId: string;
  productTitle: string;
  productImage?: string;
  currentModelUrl?: string;
  currentModelType?: 'gltf' | 'glb' | 'usdz';
  currentModelStatus?: 'none' | 'generating' | 'ready' | 'failed';
  onModelUpdate?: (modelData: {
    modelUrl?: string;
    modelType?: 'gltf' | 'glb' | 'usdz';
    modelStatus?: 'none' | 'generating' | 'ready' | 'failed';
  }) => void;
}

interface GenerationStatus {
  taskId: string;
  status: 'submitted' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
}

const Product3DManager: React.FC<Product3DManagerProps> = ({
  productId,
  productTitle,
  productImage,
  currentModelUrl,
  currentModelType,
  currentModelStatus = 'none',
  onModelUpdate
}) => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Poll generation status
  useEffect(() => {
    if (generationStatus && generationStatus.status === 'processing' && autoRefresh) {
      const interval = setInterval(async () => {
        await checkGenerationStatus();
      }, 5000); // Poll every 5 seconds

      return () => clearInterval(interval);
    }
  }, [generationStatus, autoRefresh]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['model/gltf-binary', 'model/gltf+json', 'application/octet-stream'];
    const allowedExtensions = ['.gltf', '.glb', '.usdz'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      setError('Invalid file type. Only GLTF, GLB, and USDZ files are allowed.');
      return;
    }

    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      setError('File size too large. Maximum size is 50MB.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('model', file);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ar/${productId}/upload-3d`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Upload failed');
      }

      onModelUpdate?.({
        modelUrl: result.modelUrl,
        modelType: result.modelType,
        modelStatus: 'ready'
      });

      setSuccess('3D model uploaded successfully!');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleGenerate3D = async () => {
    if (!productImage) {
      setError('Product image is required to generate 3D model');
      return;
    }

    setGenerating(true);
    setError(null);
    setAutoRefresh(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ar/${productId}/generate-3d`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Generation failed');
      }

      setGenerationStatus({
        taskId: result.taskId,
        status: result.status,
        progress: result.progress
      });

      onModelUpdate?.({
        modelStatus: 'generating'
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
      setGenerating(false);
      setAutoRefresh(false);
    }
  };

  const checkGenerationStatus = async () => {
    if (!generationStatus?.taskId) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ar/${productId}/3d-status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Status check failed');
      }

      setGenerationStatus({
        taskId: generationStatus.taskId,
        status: result.status,
        progress: result.progress,
        error: result.error
      });

      if (result.status === 'completed' && result.modelUrl) {
        onModelUpdate?.({
          modelUrl: result.modelUrl,
          modelType: 'glb',
          modelStatus: 'ready'
        });
        setGenerating(false);
        setAutoRefresh(false);
        setSuccess('3D model generated successfully!');
      } else if (result.status === 'failed') {
        onModelUpdate?.({
          modelStatus: 'failed'
        });
        setGenerating(false);
        setAutoRefresh(false);
        setError(result.error || 'Generation failed');
      }

    } catch (err) {
      console.error('Error checking generation status:', err);
    }
  };

  const handleRegenerate = async () => {
    setGenerating(true);
    setError(null);
    setAutoRefresh(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ar/${productId}/regenerate-3d`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Regeneration failed');
      }

      setGenerationStatus({
        taskId: result.taskId,
        status: result.status,
        progress: result.progress
      });

      onModelUpdate?.({
        modelStatus: 'generating'
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Regeneration failed');
      setGenerating(false);
      setAutoRefresh(false);
    }
  };

  const handleDeleteModel = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ar/${productId}/3d-model`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'Delete failed');
      }

      onModelUpdate?.({
        modelUrl: undefined,
        modelType: undefined,
        modelStatus: 'none'
      });

      setSuccess('3D model deleted successfully!');
      setDeleteConfirmOpen(false);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const getStatusIcon = () => {
    switch (currentModelStatus) {
      case 'ready':
        return <CheckIcon color="success" />;
      case 'generating':
        return <ScheduleIcon color="warning" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  const getStatusColor = () => {
    switch (currentModelStatus) {
      case 'ready':
        return 'success';
      case 'generating':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'info';
    }
  };

  const getStatusText = () => {
    switch (currentModelStatus) {
      case 'ready':
        return '3D Model Ready';
      case 'generating':
        return 'Generating 3D Model...';
      case 'failed':
        return 'Generation Failed';
      default:
        return 'No 3D Model';
    }
  };

  return (
    <Paper sx={{ p: 3, borderRadius: 3, bgcolor: 'background.paper' }}>
      <Stack spacing={3}>
        {/* Header */}
        <Box>
          <Stack direction="row" alignItems="center" spacing={2} mb={2}>
            <Typography variant="h6" fontWeight={700}>
              🎯 3D Model & AR Viewer
            </Typography>
            <Chip
              icon={getStatusIcon()}
              label={getStatusText()}
              color={getStatusColor() as any}
              variant="filled"
            />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Upload a custom 3D model or generate one automatically from your product image using AI.
          </Typography>
        </Box>

        {/* Error/Success Messages */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Current Model Status */}
        {currentModelStatus === 'generating' && (
          <Card sx={{ bgcolor: 'warning.50', border: '1px solid', borderColor: 'warning.200' }}>
            <CardContent>
              <Stack spacing={2}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <CircularProgress size={24} />
                  <Typography variant="subtitle1" fontWeight={600}>
                    Generating 3D Model...
                  </Typography>
                </Stack>
                <LinearProgress 
                  variant="determinate" 
                  value={generationStatus?.progress || 0}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="caption" color="text.secondary">
                  This may take 2-5 minutes. The page will update automatically.
                </Typography>
                <Stack direction="row" spacing={1}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={autoRefresh}
                        onChange={(e) => setAutoRefresh(e.target.checked)}
                        size="small"
                      />
                    }
                    label="Auto-refresh"
                  />
                  <Button
                    size="small"
                    startIcon={<RefreshIcon />}
                    onClick={checkGenerationStatus}
                    disabled={!generationStatus?.taskId}
                  >
                    Check Status
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <Grid container spacing={2}>
          {/* Upload Custom Model */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Stack spacing={2}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <CloudUploadIcon color="primary" />
                    <Typography variant="subtitle1" fontWeight={600}>
                      Upload Custom Model
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    Upload your own GLTF, GLB, or USDZ file
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<UploadIcon />}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading || generating}
                    fullWidth
                    sx={{ py: 1.5 }}
                  >
                    {uploading ? 'Uploading...' : 'Choose File'}
                  </Button>
                  <Typography variant="caption" color="text.secondary" textAlign="center">
                    Max file size: 50MB
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Generate with AI */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Stack spacing={2}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <AIIcon color="secondary" />
                    <Typography variant="subtitle1" fontWeight={600}>
                      Generate with AI
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    Create 3D model from product image using Meshy.ai
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={generating ? <CircularProgress size={20} /> : <AIIcon />}
                    onClick={currentModelStatus === 'ready' ? handleRegenerate : handleGenerate3D}
                    disabled={generating || !productImage}
                    fullWidth
                    sx={{ py: 1.5 }}
                  >
                    {generating 
                      ? 'Generating...' 
                      : currentModelStatus === 'ready' 
                        ? 'Regenerate Model' 
                        : 'Generate Model'
                    }
                  </Button>
                  {!productImage && (
                    <Typography variant="caption" color="error" textAlign="center">
                      Product image required
                    </Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Current Model Actions */}
        {currentModelStatus === 'ready' && currentModelUrl && (
          <Card sx={{ bgcolor: 'success.50', border: '1px solid', borderColor: 'success.200' }}>
            <CardContent>
              <Stack spacing={2}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <CheckIcon color="success" />
                  <Typography variant="subtitle1" fontWeight={600}>
                    3D Model Available
                  </Typography>
                  <Chip 
                    label={currentModelType?.toUpperCase()} 
                    size="small" 
                    color="success" 
                    variant="outlined"
                  />
                </Stack>
                
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Button
                    variant="outlined"
                    startIcon={<ViewIcon />}
                    onClick={() => setPreviewOpen(true)}
                    size="small"
                  >
                    Preview
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = currentModelUrl;
                      link.download = `${productTitle.replace(/[^a-zA-Z0-9]/g, '_')}.${currentModelType}`;
                      link.click();
                    }}
                    size="small"
                  >
                    Download
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={handleRegenerate}
                    disabled={generating}
                    size="small"
                  >
                    Regenerate
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => setDeleteConfirmOpen(true)}
                    size="small"
                  >
                    Delete
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        )}

        {/* Failed Status */}
        {currentModelStatus === 'failed' && (
          <Card sx={{ bgcolor: 'error.50', border: '1px solid', borderColor: 'error.200' }}>
            <CardContent>
              <Stack spacing={2}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <ErrorIcon color="error" />
                  <Typography variant="subtitle1" fontWeight={600}>
                    Generation Failed
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  The AI generation failed. You can try again or upload a custom model.
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="contained"
                    startIcon={<AIIcon />}
                    onClick={handleGenerate3D}
                    disabled={generating || !productImage}
                    size="small"
                  >
                    Try Again
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<UploadIcon />}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    size="small"
                  >
                    Upload Instead
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card sx={{ bgcolor: 'info.50', border: '1px solid', borderColor: 'info.200' }}>
          <CardContent>
            <Stack spacing={1}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <InfoIcon color="info" />
                <Typography variant="subtitle2" fontWeight={600}>
                  About 3D Models & AR
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                • GLB format is recommended for best compatibility<br/>
                • USDZ format is required for iOS AR Quick Look<br/>
                • AI generation typically takes 2-5 minutes<br/>
                • Models are automatically optimized for web viewing<br/>
                • AR viewing works best on mobile devices
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".gltf,.glb,.usdz"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
          <DialogTitle>Delete 3D Model</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete the 3D model for "{productTitle}"? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
            <Button onClick={handleDeleteModel} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">{productTitle} - 3D Model Preview</Typography>
              <IconButton onClick={() => setPreviewOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Stack>
          </DialogTitle>
          <DialogContent>
            {currentModelUrl && (
              <Box sx={{ height: 400, width: '100%' }}>
                <model-viewer
                  src={currentModelUrl}
                  alt={productTitle}
                  auto-rotate
                  camera-controls
                  style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#f5f5f5'
                  }}
                />
              </Box>
            )}
          </DialogContent>
        </Dialog>
      </Stack>
    </Paper>
  );
};

export default Product3DManager;
