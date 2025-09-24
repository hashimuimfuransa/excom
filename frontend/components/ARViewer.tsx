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
  Switch,
  FormControlLabel,
  Slider,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Divider
} from '@mui/material';
import {
  ViewInAr as ArIcon,
  RotateLeft as RotateIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Refresh as RefreshIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Fullscreen as FullscreenIcon,
  Settings as SettingsIcon,
  Close as CloseIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Info as InfoIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

// Declare model-viewer element for TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': any;
    }
  }
}

interface ARViewerProps {
  modelUrl: string;
  modelType: 'gltf' | 'glb' | 'usdz';
  productTitle: string;
  productImage?: string;
  onError?: (error: string) => void;
  onLoad?: () => void;
}

interface ARControlsProps {
  autoRotate: boolean;
  onAutoRotateChange: (enabled: boolean) => void;
  cameraOrbit: { theta: number; phi: number; radius: number };
  onCameraOrbitChange: (orbit: { theta: number; phi: number; radius: number }) => void;
  onReset: () => void;
  onFullscreen: () => void;
  onDownload: () => void;
  onShare: () => void;
}

const ARControls: React.FC<ARControlsProps> = ({
  autoRotate,
  onAutoRotateChange,
  cameraOrbit,
  onCameraOrbitChange,
  onReset,
  onFullscreen,
  onDownload,
  onShare
}) => {
  const { t } = useTranslation();

  return (
    <Paper sx={{ p: 2, borderRadius: 2, bgcolor: 'background.paper', boxShadow: 2 }}>
      <Stack spacing={2}>
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
          🎮 {t('arViewer.controls') || '3D Controls'}
        </Typography>
        
        {/* Auto-rotate toggle */}
        <FormControlLabel
          control={
            <Switch
              checked={autoRotate}
              onChange={(e) => onAutoRotateChange(e.target.checked)}
              color="primary"
            />
          }
          label={
            <Stack direction="row" alignItems="center" spacing={1}>
              {autoRotate ? <PlayIcon fontSize="small" /> : <PauseIcon fontSize="small" />}
              <Typography variant="body2">
                {t('arViewer.autoRotate') || 'Auto Rotate'}
              </Typography>
            </Stack>
          }
        />

        {/* Camera controls */}
        <Box>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            {t('arViewer.cameraAngle') || 'Camera Angle'}
          </Typography>
          <Stack spacing={1}>
            <Box>
              <Typography variant="caption">Theta: {cameraOrbit.theta.toFixed(1)}°</Typography>
              <Slider
                value={cameraOrbit.theta}
                onChange={(_, value) => onCameraOrbitChange({ ...cameraOrbit, theta: value as number })}
                min={0}
                max={360}
                step={1}
                size="small"
                color="primary"
              />
            </Box>
            <Box>
              <Typography variant="caption">Phi: {cameraOrbit.phi.toFixed(1)}°</Typography>
              <Slider
                value={cameraOrbit.phi}
                onChange={(_, value) => onCameraOrbitChange({ ...cameraOrbit, phi: value as number })}
                min={0}
                max={180}
                step={1}
                size="small"
                color="primary"
              />
            </Box>
            <Box>
              <Typography variant="caption">Zoom: {cameraOrbit.radius.toFixed(1)}</Typography>
              <Slider
                value={cameraOrbit.radius}
                onChange={(_, value) => onCameraOrbitChange({ ...cameraOrbit, radius: value as number })}
                min={0.5}
                max={5}
                step={0.1}
                size="small"
                color="primary"
              />
            </Box>
          </Stack>
        </Box>

        {/* Action buttons */}
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Tooltip title={t('arViewer.resetView') || 'Reset View'}>
            <IconButton onClick={onReset} size="small" color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('arViewer.fullscreen') || 'Fullscreen'}>
            <IconButton onClick={onFullscreen} size="small" color="primary">
              <FullscreenIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('arViewer.download') || 'Download Model'}>
            <IconButton onClick={onDownload} size="small" color="primary">
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('arViewer.share') || 'Share'}>
            <IconButton onClick={onShare} size="small" color="primary">
              <ShareIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>
    </Paper>
  );
};

const ARViewer: React.FC<ARViewerProps> = ({
  modelUrl,
  modelType,
  productTitle,
  productImage,
  onError,
  onLoad
}) => {
  const { t } = useTranslation();
  const modelViewerRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRotate, setAutoRotate] = useState(false);
  const [cameraOrbit, setCameraOrbit] = useState({ theta: 0, phi: 75, radius: 1.5 });
  const [showControls, setShowControls] = useState(false);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [arSupported, setArSupported] = useState(false);

  useEffect(() => {
    // Check if AR is supported
    const checkARSupport = async () => {
      if ('xr' in navigator) {
        try {
          const isSupported = await (navigator as any).xr.isSessionSupported('immersive-ar');
          setArSupported(isSupported);
        } catch (e) {
          console.log('AR not supported:', e);
        }
      }
    };
    
    checkARSupport();
  }, []);

  const handleModelLoad = () => {
    setLoading(false);
    setError(null);
    onLoad?.();
  };

  const handleModelError = (event: any) => {
    const errorMessage = event.detail?.message || 'Failed to load 3D model';
    setError(errorMessage);
    setLoading(false);
    onError?.(errorMessage);
  };

  const handleARClick = () => {
    if (modelViewerRef.current && arSupported) {
      modelViewerRef.current.activateAR();
    }
  };

  const handleReset = () => {
    if (modelViewerRef.current) {
      modelViewerRef.current.cameraOrbit = '0deg 75deg 1.5m';
      setCameraOrbit({ theta: 0, phi: 75, radius: 1.5 });
    }
  };

  const handleFullscreen = () => {
    if (modelViewerRef.current) {
      modelViewerRef.current.requestFullscreen();
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = modelUrl;
    link.download = `${productTitle.replace(/[^a-zA-Z0-9]/g, '_')}.${modelType}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${productTitle} - 3D Model`,
          text: `Check out this 3D model of ${productTitle}`,
          url: window.location.href
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const updateCameraOrbit = () => {
    if (modelViewerRef.current) {
      const orbitString = `${cameraOrbit.theta}deg ${cameraOrbit.phi}deg ${cameraOrbit.radius}m`;
      modelViewerRef.current.cameraOrbit = orbitString;
    }
  };

  useEffect(() => {
    updateCameraOrbit();
  }, [cameraOrbit]);

  useEffect(() => {
    if (modelViewerRef.current) {
      modelViewerRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Main 3D Viewer */}
      <Paper 
        sx={{ 
          width: '100%', 
          height: 400, 
          borderRadius: 3, 
          overflow: 'hidden',
          position: 'relative',
          bgcolor: 'grey.50'
        }}
      >
        {loading && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(255, 255, 255, 0.9)',
              zIndex: 2
            }}
          >
            <CircularProgress size={60} />
            <Typography variant="body2" sx={{ mt: 2 }}>
              {t('arViewer.loading') || 'Loading 3D model...'}
            </Typography>
          </Box>
        )}

        {error && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(255, 255, 255, 0.9)',
              zIndex: 2,
              p: 2
            }}
          >
            <ErrorIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="body1" color="error" textAlign="center">
              {error}
            </Typography>
            <Button 
              variant="outlined" 
              onClick={() => window.location.reload()} 
              sx={{ mt: 2 }}
            >
              {t('arViewer.retry') || 'Retry'}
            </Button>
          </Box>
        )}

        <model-viewer
          ref={modelViewerRef}
          src={modelUrl}
          alt={productTitle}
          auto-rotate={autoRotate}
          camera-orbit={`${cameraOrbit.theta}deg ${cameraOrbit.phi}deg ${cameraOrbit.radius}m`}
          camera-controls
          touch-action="pan-y"
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#f5f5f5'
          }}
          onLoad={handleModelLoad}
          onError={handleModelError}
          ar={arSupported}
          ar-modes="webxr scene-viewer"
          ios-src={modelType === 'usdz' ? modelUrl : undefined}
          poster={productImage}
        >
          {/* Loading slot */}
          <div slot="poster" style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f5f5f5'
          }}>
            {productImage && (
              <img 
                src={productImage} 
                alt={productTitle}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain'
                }}
              />
            )}
          </div>
        </model-viewer>

        {/* AR Button */}
        {arSupported && (
          <Button
            variant="contained"
            startIcon={<ArIcon />}
            onClick={handleARClick}
            sx={{
              position: 'absolute',
              bottom: 16,
              right: 16,
              bgcolor: 'primary.main',
              '&:hover': {
                bgcolor: 'primary.dark'
              },
              borderRadius: 2,
              px: 3,
              py: 1.5,
              fontWeight: 600,
              boxShadow: 3
            }}
          >
            {t('arViewer.viewInAR') || 'View in AR'}
          </Button>
        )}

        {/* Controls Toggle */}
        <IconButton
          onClick={() => setShowControls(!showControls)}
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            bgcolor: 'rgba(255, 255, 255, 0.9)',
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 1)'
            }
          }}
        >
          <SettingsIcon />
        </IconButton>
      </Paper>

      {/* Controls Panel */}
      {showControls && (
        <Box sx={{ mt: 2 }}>
          <ARControls
            autoRotate={autoRotate}
            onAutoRotateChange={setAutoRotate}
            cameraOrbit={cameraOrbit}
            onCameraOrbitChange={setCameraOrbit}
            onReset={handleReset}
            onFullscreen={handleFullscreen}
            onDownload={handleDownload}
            onShare={handleShare}
          />
        </Box>
      )}

      {/* AR Support Info */}
      <Box sx={{ mt: 2 }}>
        <Alert 
          severity={arSupported ? "success" : "info"} 
          icon={arSupported ? <CheckIcon /> : <InfoIcon />}
          sx={{ borderRadius: 2 }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="body2">
              {arSupported 
                ? t('arViewer.arSupported') || 'AR is supported on this device'
                : t('arViewer.arNotSupported') || 'AR is not supported on this device'
              }
            </Typography>
            {!arSupported && (
              <Chip 
                label={t('arViewer.mobileRecommended') || 'Mobile recommended'} 
                size="small" 
                color="info" 
                variant="outlined"
              />
            )}
          </Stack>
        </Alert>
      </Box>

      {/* Fullscreen Dialog */}
      <Dialog
        open={fullscreenOpen}
        onClose={() => setFullscreenOpen(false)}
        maxWidth={false}
        fullWidth
        PaperProps={{
          sx: {
            width: '100vw',
            height: '100vh',
            maxWidth: 'none',
            maxHeight: 'none',
            m: 0,
            borderRadius: 0
          }
        }}
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">{productTitle} - 3D Model</Typography>
            <IconButton onClick={() => setFullscreenOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ p: 0, height: 'calc(100vh - 120px)' }}>
          <model-viewer
            src={modelUrl}
            alt={productTitle}
            auto-rotate={autoRotate}
            camera-controls
            style={{
              width: '100%',
              height: '100%'
            }}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ARViewer;
