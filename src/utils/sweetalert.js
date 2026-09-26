'use client';

/**
 * @file sweetalert.js
 * @description Theme-aware SweetAlert2 utility for VisitExpo Admin.
 * Replaces native browser alerts and confirmations with branded, animated modals.
 */

import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

const isDarkMode = () => {
  if (typeof document === 'undefined') return true;
  return document.documentElement.classList.contains('dark') || document.body.classList.contains('dark');
};

const getThemeConfig = () => {
  const dark = isDarkMode();
  return {
    background: dark ? '#18181b' : '#ffffff',
    color: dark ? '#f4f4f5' : '#18181b',
    backdrop: 'rgba(0, 0, 0, 0.65)',
    confirmButtonColor: '#f59e0b',
    cancelButtonColor: dark ? '#27272a' : '#e4e4e7',
    customClass: {
      popup: 'visitexpo-swal-popup',
      title: 'visitexpo-swal-title',
      htmlContainer: 'visitexpo-swal-text',
      confirmButton: 'visitexpo-swal-confirm-btn',
      cancelButton: 'visitexpo-swal-cancel-btn',
      actions: 'visitexpo-swal-actions'
    },
    buttonsStyling: false
  };
};

export const showSweetAlert = (messageOrOptions, type = 'info', title = '') => {
  if (typeof window === 'undefined') return Promise.resolve();

  let text = '';
  let icon = type;
  let customTitle = title;
  let confirmText = 'OK';

  if (typeof messageOrOptions === 'object' && messageOrOptions !== null) {
    text = messageOrOptions.text || messageOrOptions.message || '';
    icon = messageOrOptions.icon || type;
    customTitle = messageOrOptions.title || customTitle;
    confirmText = messageOrOptions.confirmButtonText || confirmText;
  } else {
    text = String(messageOrOptions || '');
  }

  if (!customTitle) {
    switch (icon) {
      case 'success':
        customTitle = 'Success';
        break;
      case 'error':
        customTitle = 'Error';
        break;
      case 'warning':
        customTitle = 'Attention';
        break;
      default:
        customTitle = 'Notice';
    }
  }

  const baseConfig = getThemeConfig();

  return Swal.fire({
    ...baseConfig,
    title: customTitle,
    text,
    icon,
    confirmButtonText: confirmText
  });
};

export const showSweetConfirm = async (titleOrOptions, text = '', customConfig = {}) => {
  if (typeof window === 'undefined') return false;

  let title = 'Are you sure?';
  let message = text;
  let icon = 'warning';
  let confirmButtonText = 'Yes, Proceed';
  let cancelButtonText = 'Cancel';
  let isDanger = true;

  if (typeof titleOrOptions === 'object' && titleOrOptions !== null) {
    title = titleOrOptions.title || title;
    message = titleOrOptions.text || titleOrOptions.message || message;
    icon = titleOrOptions.icon || icon;
    confirmButtonText = titleOrOptions.confirmButtonText || confirmButtonText;
    cancelButtonText = titleOrOptions.cancelButtonText || cancelButtonText;
    isDanger = titleOrOptions.isDanger !== undefined ? titleOrOptions.isDanger : true;
  } else if (titleOrOptions) {
    title = titleOrOptions;
  }

  const baseConfig = getThemeConfig();

  const result = await Swal.fire({
    ...baseConfig,
    title,
    text: message,
    icon,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true,
    focusCancel: true,
    customClass: {
      ...baseConfig.customClass,
      confirmButton: isDanger ? 'visitexpo-swal-confirm-danger-btn' : 'visitexpo-swal-confirm-btn'
    },
    ...customConfig
  });

  return Boolean(result.isConfirmed);
};

export const showSweetSuccess = (message, title = 'Success') => showSweetAlert(message, 'success', title);
export const showSweetError = (message, title = 'Error') => showSweetAlert(message, 'error', title);
export const showSweetWarning = (message, title = 'Attention') => showSweetAlert(message, 'warning', title);
export const showSweetInfo = (message, title = 'Notice') => showSweetAlert(message, 'info', title);

export const initSweetAlertInterceptors = () => {
  if (typeof window === 'undefined') return;
  window.alert = (message) => {
    showSweetAlert(String(message ?? ''));
  };
};

export default Swal;
