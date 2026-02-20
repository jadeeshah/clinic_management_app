import React, { useState, useMemo } from 'react';
import {
  Autocomplete,
  TextField,
  Chip,
  Box,
  Typography,
  Paper,
  ListItem,
  ListItemText,
} from '@mui/material';
import { icd10Codes, type ICD10Code } from '../../data/icd10-codes';

interface ICD10SelectorProps {
  value: ICD10Code[];
  onChange: (codes: ICD10Code[]) => void;
  label?: string;
  placeholder?: string;
  maxSelections?: number;
  error?: boolean;
  helperText?: string;
}

const ICD10Selector: React.FC<ICD10SelectorProps> = ({
  value,
  onChange,
  label = 'Diagnosis (ICD-10)',
  placeholder = 'Search by code or description...',
  maxSelections = 10,
  error = false,
  helperText,
}) => {
  const [inputValue, setInputValue] = useState('');

  // Filter options based on input
  const filteredOptions = useMemo(() => {
    if (!inputValue || inputValue.length < 2) {
      // Show some common codes when no search
      return icd10Codes.slice(0, 10);
    }

    const query = inputValue.toLowerCase();
    return icd10Codes
      .filter(
        (code) =>
          code.code.toLowerCase().includes(query) ||
          code.description.toLowerCase().includes(query) ||
          code.category.toLowerCase().includes(query)
      )
      .slice(0, 30);
  }, [inputValue]);

  const handleChange = (_: unknown, newValue: ICD10Code[]) => {
    if (newValue.length <= maxSelections) {
      onChange(newValue);
    }
  };

  return (
    <Autocomplete
      multiple
      value={value}
      onChange={handleChange}
      inputValue={inputValue}
      onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
      options={filteredOptions}
      getOptionLabel={(option) => `${option.code} - ${option.description}`}
      isOptionEqualToValue={(option, val) => option.code === val.code}
      filterOptions={(x) => x} // Disable built-in filtering since we do our own
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={value.length === 0 ? placeholder : ''}
          error={error}
          helperText={helperText || `Type at least 2 characters to search. Selected: ${value.length}/${maxSelections}`}
        />
      )}
      renderOption={(props, option) => (
        <ListItem {...props} key={option.code}>
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography
                  component="span"
                  variant="body2"
                  sx={{
                    fontWeight: 'bold',
                    bgcolor: 'primary.light',
                    color: 'primary.contrastText',
                    px: 0.75,
                    py: 0.25,
                    borderRadius: 0.5,
                    fontSize: '0.75rem',
                  }}
                >
                  {option.code}
                </Typography>
                <Typography component="span" variant="body2">
                  {option.description}
                </Typography>
              </Box>
            }
            secondary={
              <Typography variant="caption" color="text.secondary">
                {option.category}
              </Typography>
            }
          />
        </ListItem>
      )}
      renderTags={(selected, getTagProps) =>
        selected.map((option, index) => (
          <Chip
            {...getTagProps({ index })}
            key={option.code}
            label={option.code}
            title={option.description}
            size="small"
            sx={{ maxWidth: 100 }}
          />
        ))
      }
      PaperComponent={(props) => (
        <Paper {...props} sx={{ maxHeight: 300 }} />
      )}
      noOptionsText={
        inputValue.length < 2
          ? 'Type at least 2 characters to search'
          : 'No matching ICD-10 codes found'
      }
      loading={false}
      clearOnBlur={false}
      selectOnFocus
      handleHomeEndKeys
    />
  );
};

export default ICD10Selector;
