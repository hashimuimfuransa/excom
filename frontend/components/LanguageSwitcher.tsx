"use client";
import React, { useState } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Box,
  Fade
} from '@mui/material';
import {
  Language as LanguageIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import EnglandFlag from './flags/EnglandFlag';
import RwandaFlag from './flags/RwandaFlag';

const languages = [
  { code: 'en', name: 'English', flag: EnglandFlag },
  { code: 'rw', name: 'Kinyarwanda', flag: RwandaFlag }
];

export default function LanguageSwitcher() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { t, i18n } = useTranslation('common');
  const router = useRouter();
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = async (languageCode: string) => {
    try {
      // Change the language in i18next
      await i18n.changeLanguage(languageCode);
      
      // Store in localStorage
      localStorage.setItem('excom_language', languageCode);
      
      // Refresh the page to apply changes
      window.location.reload();
    } catch (error) {
      console.error('Failed to change language:', error);
    }
    handleClose();
  };

  const getCurrentLanguage = () => {
    return languages.find(lang => lang.code === i18n.language) || languages[0];
  };

  const currentLanguage = getCurrentLanguage();

  return (
    <>
      <IconButton
        onClick={handleClick}
        aria-label={t('language.changeLanguage')}
        sx={{
          transition: 'transform 0.2s ease',
          '&:hover': {
            transform: 'scale(1.1)'
          }
        }}
      >
        <Box sx={{ 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 24,
          height: 24,
          borderRadius: '50%',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.3)',
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)'
        }}>
          <currentLanguage.flag size={20} />
        </Box>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        TransitionComponent={Fade}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        sx={{
          '& .MuiPaper-root': {
            borderRadius: 2,
            minWidth: 180,
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
            border: '1px solid rgba(0,0,0,0.1)'
          }
        }}
      >
        <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2" fontWeight={600}>
            {t('language.changeLanguage')}
          </Typography>
        </Box>
        
        {languages.map((language) => {
          const isSelected = i18n.language === language.code;
          
          return (
            <MenuItem
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              sx={{
                gap: 1.5,
                minHeight: 48,
                backgroundColor: isSelected ? 'action.selected' : 'transparent',
                '&:hover': {
                  backgroundColor: isSelected ? 'action.selected' : 'action.hover'
                }
              }}
            >
              <Box sx={{ 
                minWidth: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <language.flag size={20} />
              </Box>
              
              <Typography variant="body2" sx={{ flexGrow: 1 }}>
                {language.name}
              </Typography>
              
              {isSelected && (
                <CheckIcon 
                  fontSize="small" 
                  sx={{ color: 'primary.main' }}
                />
              )}
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}