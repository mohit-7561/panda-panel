import React from 'react';
import { 
  TableCell, 
  TableRow, 
  Box, 
  Typography, 
  Tooltip, 
  Chip, 
  IconButton 
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { toast } from 'react-toastify';

// This component handles the display of a single key row
const KeyDisplay = ({ keyData, currentUser, styles, handleOpenDeleteKeyDialog, handleOpenEditKeyDialog }) => {
  return (
    <TableRow 
      key={keyData._id}
      sx={{
        transition: 'all 0.2s ease',
        // Add enhanced styling for reseller panel rows
        ...(currentUser.role === 'admin' && {
          '&:hover': {
            backgroundColor: 'rgba(0, 195, 255, 0.1)',
            boxShadow: 'inset 0 0 5px rgba(0, 195, 255, 0.2)'
          }
        })
      }}
    >
      <TableCell 
        className={styles.keyCell}
        sx={currentUser.role === 'admin' ? {
          borderRight: '1px solid rgba(255, 255, 255, 0.1)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        } : {}}
      >
        <Tooltip title="Copy key" arrow placement="top">
          <Box 
            className={styles.copyableKey}
            onClick={() => {
              navigator.clipboard.writeText(keyData.key);
              toast.success('Key copied to clipboard');
            }}
            sx={{ 
              fontSize: { xs: '0.7rem', sm: '0.85rem' },
              maxWidth: { xs: '100px', sm: '150px', md: '240px' },
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              backgroundColor: 'rgba(0,0,0,0.1)',
              py: { xs: 0.5, sm: 0.75 },
              px: { xs: 1, sm: 1.5 },
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              border: '1px solid rgba(255,255,255,0.1)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: 'rgba(0,0,0,0.2)',
                borderColor: 'rgba(255,255,255,0.2)'
              }
            }}
          >
            {/* Display first 5 characters followed by ellipsis on mobile, more on larger screens */}
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', overflow: 'hidden' }}>
              <Typography sx={{ 
                display: { xs: 'block', sm: 'none' },
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                width: '100%'
              }}>
                {keyData.key.substring(0, 5)}...
              </Typography>
              <Typography sx={{ 
                display: { xs: 'none', sm: 'block' },
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                width: '100%'
              }}>
                {keyData.key}
              </Typography>
            </Box>
            <ContentCopyIcon fontSize="small" className={styles.copyIcon} />
          </Box>
        </Tooltip>
      </TableCell>
      <TableCell
        sx={currentUser.role === 'admin' ? {
          borderRight: '1px solid rgba(255, 255, 255, 0.1)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        } : {}}
      >
        <Typography sx={{ fontSize: { xs: '0.6rem', sm: '0.75rem', md: '0.875rem' } }}>
          {new Date(keyData.createdAt).toLocaleDateString()}
        </Typography>
      </TableCell>
      <TableCell
        sx={currentUser.role === 'admin' ? {
          borderRight: '1px solid rgba(255, 255, 255, 0.1)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        } : {}}
      >
        <Typography sx={{ fontSize: { xs: '0.6rem', sm: '0.75rem', md: '0.875rem' } }}>
          {new Date(keyData.expiresAt).toLocaleDateString()}
        </Typography>
      </TableCell>
      <TableCell
        sx={currentUser.role === 'admin' ? {
          borderRight: '1px solid rgba(255, 255, 255, 0.1)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        } : {}}
      >
        <Chip 
          label={keyData.isActive ? 'Active' : 'Inactive'} 
          color={keyData.isActive ? 'success' : 'error'}
          size="small"
          sx={{
            height: { xs: '18px', sm: '24px' },
            '& .MuiChip-label': { 
              px: { xs: 0.75, sm: 1 },
              fontSize: { xs: '0.6rem', sm: '0.75rem' }
            }
          }}
        />
      </TableCell>
      <TableCell
        sx={currentUser.role === 'admin' ? {
          borderRight: '1px solid rgba(255, 255, 255, 0.1)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        } : {}}
      >
        <Typography sx={{ fontSize: { xs: '0.6rem', sm: '0.75rem', md: '0.875rem' } }}>
          {keyData.maxDevices === 0 ? 'Unlimited' : keyData.maxDevices}
        </Typography>
      </TableCell>
      {currentUser.role === 'owner' && (
        <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
          {keyData.createdBy ? (
            keyData.createdBy._id === currentUser._id ? (
              <Chip 
                size="small" 
                label="You (Owner)" 
                sx={{
                  bgcolor: 'rgba(156, 39, 176, 0.15)',
                  color: '#ce93d8',
                  borderColor: 'rgba(156, 39, 176, 0.5)',
                  border: '1px solid',
                  fontSize: '0.7rem',
                  height: '22px',
                  fontWeight: 'bold'
                }} 
              />
            ) : keyData.createdBy.role === 'owner' ? (
              <Chip 
                size="small" 
                label="Owner" 
                sx={{
                  bgcolor: 'rgba(156, 39, 176, 0.15)',
                  color: '#ce93d8',
                  borderColor: 'rgba(156, 39, 176, 0.5)',
                  border: '1px solid',
                  fontSize: '0.7rem',
                  height: '22px'
                }} 
              />
            ) : (
              <Chip 
                size="small" 
                label={keyData.createdBy.username || "Admin"} 
                sx={{
                  bgcolor: 'rgba(33, 150, 243, 0.15)',
                  color: '#90caf9',
                  borderColor: 'rgba(33, 150, 243, 0.5)',
                  border: '1px solid',
                  fontSize: '0.7rem',
                  height: '22px'
                }} 
              />
            )
          ) : (
            <Chip 
              size="small" 
              label="Unknown" 
              sx={{
                bgcolor: 'rgba(158, 158, 158, 0.15)',
                color: '#bdbdbd',
                borderColor: 'rgba(158, 158, 158, 0.5)',
                border: '1px solid',
                fontSize: '0.7rem',
                height: '22px'
              }} 
            />
          )}
        </TableCell>
      )}
      <TableCell align="right"
        sx={currentUser.role === 'admin' ? {
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        } : {}}
      >
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Tooltip title="Delete Key" arrow placement="top">
            <IconButton
              size="small"
              onClick={() => handleOpenDeleteKeyDialog(keyData)}
              className={styles.deleteButton}
              sx={{
                bgcolor: 'rgba(244, 67, 54, 0.1)',
                borderRadius: '8px',
                p: { xs: 0.5, sm: 0.75 },
                minWidth: { xs: '28px', sm: '32px' },
                minHeight: { xs: '28px', sm: '32px' },
                '&:hover': {
                  bgcolor: 'rgba(244, 67, 54, 0.2)',
                }
              }}
            >
              <DeleteIcon fontSize="small" sx={{ color: '#f44336', fontSize: { xs: '0.9rem', sm: '1.2rem' } }} />
            </IconButton>
          </Tooltip>
          {/* Only show edit key button for owner role */}
          {currentUser.role === 'owner' && (
            <Tooltip title="Edit Key" arrow placement="top">
              <IconButton
                size="small"
                onClick={() => handleOpenEditKeyDialog(keyData)}
                className={styles.editButton}
                sx={{
                  bgcolor: 'rgba(33, 150, 243, 0.1)',
                  borderRadius: '8px',
                  p: { xs: 0.5, sm: 0.75 },
                  minWidth: { xs: '28px', sm: '32px' },
                  minHeight: { xs: '28px', sm: '32px' },
                  '&:hover': {
                    bgcolor: 'rgba(33, 150, 243, 0.2)',
                  }
                }}
              >
                <EditIcon fontSize="small" sx={{ color: '#90caf9', fontSize: { xs: '0.9rem', sm: '1.2rem' } }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </TableCell>
    </TableRow>
  );
};

export default KeyDisplay; 