import { Router, provideRouter } from '@angular/router';
import { render, type RenderResult } from '@testing-library/angular';

import { ForgotPasswordPage } from './forgot-password.page';

const VALID_EMAIL = 'user@example.com';

/** Evento de pegado minimo: jsdom no permite construir un ClipboardEvent con datos. */
const pasteEvent = (text: string): ClipboardEvent =>
  ({
    preventDefault: jest.fn(),
    clipboardData: { getData: (): string => text },
  }) as unknown as ClipboardEvent;

describe('ForgotPasswordPage', () => {
  let view: RenderResult<ForgotPasswordPage>;
  let page: ForgotPasswordPage;

  beforeEach(async () => {
    view = await render(ForgotPasswordPage, { providers: [provideRouter([])] });
    page = view.fixture.componentInstance;
  });

  const setEmail = (value: string): void => page.emailForm.controls.email.setValue(value);

  const cells = (): HTMLInputElement[] =>
    Array.from(view.fixture.nativeElement.querySelectorAll('.otp-cell'));

  /** Evita el `!` de indexado: `no-non-null-assertion` es warning y lint corre con 0 warnings. */
  const cell = (index: number): HTMLInputElement => {
    const el = cells()[index];
    if (!el) throw new Error(`No existe la celda OTP en el indice ${index}`);
    return el;
  };

  const typeDigit = (index: number, value: string): void => {
    const el = cell(index);
    el.value = value;
    el.dispatchEvent(new Event('input'));
    view.fixture.detectChanges();
  };

  const pressBackspace = (index: number): void => {
    cell(index).dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }));
    view.fixture.detectChanges();
  };

  describe('enmascarado de email', () => {
    it('oculta el interior del usuario y conserva el dominio', () => {
      setEmail(VALID_EMAIL);
      expect(page.maskedEmail()).toBe('u**r@example.com');
    });

    it('no enmascara un usuario de dos caracteres o menos', () => {
      setEmail('ab@example.com');
      expect(page.maskedEmail()).toBe('ab@example.com');
    });

    it('devuelve el texto tal cual si no hay arroba', () => {
      setEmail('sin-arroba');
      expect(page.maskedEmail()).toBe('sin-arroba');
    });

    it('tolera el valor vacio', () => {
      setEmail('');
      expect(page.maskedEmail()).toBe('');
    });
  });

  describe('validacion de email', () => {
    it('no expone error mientras el campo no se ha tocado', () => {
      setEmail('');
      expect(page.emailError()).toBeNull();
    });

    it('exige el email cuando esta vacio y ya se toco', () => {
      page.markEmailTouched();
      setEmail('');
      expect(page.emailError()).toBe('Email is required');
    });

    it('rechaza un formato invalido', () => {
      page.markEmailTouched();
      setEmail('no-es-un-email');
      expect(page.emailError()).toBe('Please enter a valid email address');
    });

    it('marca emailValid solo con un email bien formado', () => {
      setEmail('no-es-un-email');
      expect(page.emailValid()).toBe(false);
      setEmail(VALID_EMAIL);
      expect(page.emailValid()).toBe(true);
    });
  });

  describe('OTP: escritura y auto-avance', () => {
    it('guarda el digito y mueve el foco a la celda siguiente', () => {
      cell(0).focus();
      typeDigit(0, '1');

      expect(page.otpValues()[0]).toBe('1');
      expect(document.activeElement).toBe(cell(1));
    });

    it('descarta los caracteres no numericos', () => {
      typeDigit(0, 'a');
      expect(page.otpValues()[0]).toBe('');
    });

    it('se queda solo con el primer caracter', () => {
      typeDigit(0, '97');
      expect(page.otpValues()[0]).toBe('9');
    });

    it('no avanza mas alla de la ultima celda', () => {
      cell(5).focus();
      typeDigit(5, '7');

      expect(page.otpValues()[5]).toBe('7');
      expect(document.activeElement).toBe(cell(5));
    });

    it('otpComplete solo es verdadero con las 6 celdas llenas', () => {
      for (let i = 0; i < 5; i++) typeDigit(i, String(i + 1));
      expect(page.otpComplete()).toBe(false);

      typeDigit(5, '6');
      expect(page.otpComplete()).toBe(true);
    });
  });

  describe('OTP: backspace', () => {
    it('desde una celda vacia limpia la anterior y retrocede el foco', () => {
      typeDigit(0, '1');
      typeDigit(1, '2');
      cell(2).focus();

      pressBackspace(2);

      expect(page.otpValues()[1]).toBe('');
      expect(document.activeElement).toBe(cell(1));
    });

    it('no toca nada si la celda actual tiene valor', () => {
      typeDigit(0, '1');
      typeDigit(1, '2');

      pressBackspace(1);

      expect(page.otpValues()[0]).toBe('1');
      expect(page.otpValues()[1]).toBe('2');
    });

    it('no hace nada en la primera celda', () => {
      cell(0).focus();
      pressBackspace(0);
      expect(page.otpValues()).toEqual(['', '', '', '', '', '']);
    });
  });

  describe('OTP: pegado', () => {
    it('reparte los 6 digitos y deja el foco en la ultima celda', () => {
      cell(0).focus();
      page.onOtpPaste(pasteEvent('123456'));
      view.fixture.detectChanges();

      expect(page.otpValues()).toEqual(['1', '2', '3', '4', '5', '6']);
      expect(document.activeElement).toBe(cell(5));
    });

    it('filtra los separadores antes de repartir', () => {
      cell(0).focus();
      page.onOtpPaste(pasteEvent('12-34'));
      view.fixture.detectChanges();

      expect(page.otpValues()).toEqual(['1', '2', '3', '4', '', '']);
      expect(document.activeElement).toBe(cell(4));
    });

    it('empieza a repartir desde la celda enfocada', () => {
      cell(2).focus();
      page.onOtpPaste(pasteEvent('99'));
      view.fixture.detectChanges();

      expect(page.otpValues()).toEqual(['', '', '9', '9', '', '']);
    });

    it('descarta un pegado sin digitos', () => {
      cell(0).focus();
      page.onOtpPaste(pasteEvent('abc'));

      expect(page.otpValues()).toEqual(['', '', '', '', '', '']);
    });

    it('cancela el pegado nativo', () => {
      const event = pasteEvent('123456');
      page.onOtpPaste(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('ignora los digitos que exceden la longitud del codigo', () => {
      cell(4).focus();
      page.onOtpPaste(pasteEvent('123456'));

      expect(page.otpValues()).toEqual(['', '', '', '', '1', '2']);
    });
  });

  describe('envio del codigo y countdown de reenvio', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('no envia con un email invalido, pero marca el campo como tocado', () => {
      setEmail('no-es-un-email');
      page.onSendCode();

      expect(page.emailTouched()).toBe(true);
      expect(page.isSending()).toBe(false);
      expect(page.step()).toBe('email');
    });

    it('pasa al paso OTP y arranca el countdown en 60', () => {
      setEmail(VALID_EMAIL);
      page.onSendCode();
      expect(page.isSending()).toBe(true);

      jest.advanceTimersByTime(1200);

      expect(page.isSending()).toBe(false);
      expect(page.step()).toBe('otp');
      expect(page.resendCountdown()).toBe(60);
      expect(page.canResend()).toBe(false);
    });

    it('ignora un segundo envio mientras el primero sigue en curso', () => {
      setEmail(VALID_EMAIL);
      page.onSendCode();
      page.emailTouched.set(false);

      page.onSendCode();

      expect(page.emailTouched()).toBe(true);
      expect(page.step()).toBe('email');
    });

    it('descuenta un segundo por tick', () => {
      setEmail(VALID_EMAIL);
      page.onSendCode();
      jest.advanceTimersByTime(1200);

      jest.advanceTimersByTime(1000);
      expect(page.resendCountdown()).toBe(59);

      jest.advanceTimersByTime(3000);
      expect(page.resendCountdown()).toBe(56);
    });

    it('habilita el reenvio al llegar a cero', () => {
      setEmail(VALID_EMAIL);
      page.onSendCode();
      jest.advanceTimersByTime(1200);

      jest.advanceTimersByTime(60_000);

      expect(page.resendCountdown()).toBe(0);
      expect(page.canResend()).toBe(true);
    });

    it('resendCode reinicia el countdown y vuelve a bloquear', () => {
      setEmail(VALID_EMAIL);
      page.onSendCode();
      jest.advanceTimersByTime(1200);
      jest.advanceTimersByTime(60_000);

      page.resendCode();

      expect(page.canResend()).toBe(false);
      expect(page.resendCountdown()).toBe(60);
    });

    it('resendCode no hace nada mientras el countdown corre', () => {
      setEmail(VALID_EMAIL);
      page.onSendCode();
      jest.advanceTimersByTime(1200);
      jest.advanceTimersByTime(5000);

      page.resendCode();

      expect(page.resendCountdown()).toBe(55);
    });
  });

  describe('verificacion del codigo', () => {
    it('no verifica con el codigo incompleto', () => {
      typeDigit(0, '1');
      page.onVerifyOtp();
      expect(page.isVerifying()).toBe(false);
    });

    it('verifica con las 6 celdas llenas', () => {
      cell(0).focus();
      page.onOtpPaste(pasteEvent('123456'));

      page.onVerifyOtp();

      expect(page.isVerifying()).toBe(true);
    });

    it('ignora una segunda verificacion en curso', () => {
      cell(0).focus();
      page.onOtpPaste(pasteEvent('123456'));
      page.onVerifyOtp();

      page.otpValues.set(['9', '9', '9', '9', '9', '9']);
      page.onVerifyOtp();

      expect(page.isVerifying()).toBe(true);
    });
  });

  describe('navegacion entre pasos', () => {
    it('backToEmail limpia el codigo y vuelve al paso de email', () => {
      page.step.set('otp');
      page.otpValues.set(['1', '2', '3', '4', '5', '6']);
      page.isVerifying.set(true);

      page.backToEmail();

      expect(page.step()).toBe('email');
      expect(page.otpValues()).toEqual(['', '', '', '', '', '']);
      expect(page.isVerifying()).toBe(false);
    });

    it('goBack vuelve a la raiz', () => {
      const router = view.fixture.debugElement.injector.get(Router);
      const navigate = jest.spyOn(router, 'navigate').mockResolvedValue(true);

      page.goBack();

      expect(navigate).toHaveBeenCalledWith(['/']);
    });
  });
});
