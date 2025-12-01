'use client';

import { useEffect, useState } from 'react';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'alert' | 'confirm' | 'prompt';
  onConfirm?: (value?: string) => void;
  onCancel?: () => void;
  placeholder?: string;
  defaultValue?: string;
}

export default function Dialog({
  isOpen,
  onClose,
  title,
  message,
  type = 'alert',
  onConfirm,
  onCancel,
  placeholder,
  defaultValue = '',
}: DialogProps) {
  const [inputValue, setInputValue] = useState(defaultValue);

  useEffect(() => {
    if (isOpen) {
      setInputValue(defaultValue);
    }
  }, [isOpen, defaultValue]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (type === 'prompt' && onConfirm) {
      onConfirm(inputValue);
    } else if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && type !== 'confirm') {
      handleConfirm();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={type === 'confirm' || type === 'prompt' ? undefined : handleCancel}
    >
      <div
        className="card"
        style={{
          maxWidth: '500px',
          width: '90%',
          margin: '20px',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginBottom: '16px', color: '#333' }}>{title}</h2>
        <p style={{ marginBottom: '20px', color: '#666', lineHeight: '1.6' }}>{message}</p>
        
        {type === 'prompt' && (
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoFocus
            style={{ marginBottom: '20px' }}
          />
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          {(type === 'confirm' || type === 'prompt') && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleCancel}
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleConfirm}
            autoFocus={type === 'alert' || type === 'confirm'}
          >
            {type === 'prompt' ? 'OK' : type === 'confirm' ? 'Confirm' : 'OK'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Hook for easy dialog usage
export function useDialog() {
  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'alert' | 'confirm' | 'prompt';
    onConfirm?: (value?: string) => void;
    onCancel?: () => void;
    placeholder?: string;
    defaultValue?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'alert',
  });

  const showAlert = (message: string, title: string = 'Alert') => {
    return new Promise<void>((resolve) => {
      setDialog({
        isOpen: true,
        title,
        message,
        type: 'alert',
        onConfirm: () => {
          resolve();
        },
      });
    });
  };

  const showConfirm = (message: string, title: string = 'Confirm') => {
    return new Promise<boolean>((resolve) => {
      setDialog({
        isOpen: true,
        title,
        message,
        type: 'confirm',
        onConfirm: () => {
          resolve(true);
        },
        onCancel: () => {
          resolve(false);
        },
      });
    });
  };

  const showPrompt = (
    message: string,
    title: string = 'Input',
    placeholder: string = '',
    defaultValue: string = ''
  ) => {
    return new Promise<string | null>((resolve) => {
      setDialog({
        isOpen: true,
        title,
        message,
        type: 'prompt',
        placeholder,
        defaultValue,
        onConfirm: (value) => {
          resolve(value || null);
        },
        onCancel: () => {
          resolve(null);
        },
      });
    });
  };

  const closeDialog = () => {
    setDialog((prev) => ({ ...prev, isOpen: false }));
  };

  const DialogComponent = () => (
    <Dialog
      isOpen={dialog.isOpen}
      onClose={closeDialog}
      title={dialog.title}
      message={dialog.message}
      type={dialog.type}
      onConfirm={dialog.onConfirm}
      onCancel={dialog.onCancel}
      placeholder={dialog.placeholder}
      defaultValue={dialog.defaultValue}
    />
  );

  return {
    showAlert,
    showConfirm,
    showPrompt,
    DialogComponent,
  };
}

