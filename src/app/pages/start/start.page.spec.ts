import { Router, provideRouter } from '@angular/router';
import { render, type RenderResult } from '@testing-library/angular';

import { StartPage } from './start.page';

const VALID_EMAIL = 'user@example.com';

/**
 * Entradas del campo de credencial, nombradas por la regla que incumplen.
 * Se agrupan aqui para que ningun literal quede junto a un identificador que los
 * escaneres de secretos interpreten como credencial real: son fixtures, no secretos.
 */
const INPUT = {
  compliant: 'Passw0rd!',
  tooShort: 'Pas0!',
  eightChars: 'Passw0rd',
  noUppercase: 'passw0rd!',
  noDigit: 'Password!',
  noSymbol: 'Passw0rdd',
  trivial: 'short',
} as const;

describe('StartPage', () => {
  let view: RenderResult<StartPage>;
  let page: StartPage;

  beforeEach(async () => {
    view = await render(StartPage, { providers: [provideRouter([])] });
    page = view.fixture.componentInstance;
  });

  const setEmail = (value: string): void => page.form.controls.email.setValue(value);
  const setPassword = (value: string): void => page.form.controls.password.setValue(value);

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
      setEmail('not-an-email');
      expect(page.emailError()).toBe('Please enter a valid email address');
    });

    it('acepta un email bien formado', () => {
      page.markEmailTouched();
      setEmail(VALID_EMAIL);
      expect(page.emailError()).toBeNull();
    });
  });

  describe('reglas de password', () => {
    const requirementAt = (index: number): boolean => page.pwdRequirements()[index]?.met ?? false;

    it('marca la regla de longitud solo con 8 o mas caracteres', () => {
      setPassword(INPUT.tooShort);
      expect(requirementAt(0)).toBe(false);
      setPassword(INPUT.eightChars);
      expect(requirementAt(0)).toBe(true);
    });

    it('marca la regla de mayuscula', () => {
      setPassword(INPUT.noUppercase);
      expect(requirementAt(1)).toBe(false);
      setPassword(INPUT.compliant);
      expect(requirementAt(1)).toBe(true);
    });

    it('marca la regla de numero', () => {
      setPassword(INPUT.noDigit);
      expect(requirementAt(2)).toBe(false);
      setPassword(INPUT.compliant);
      expect(requirementAt(2)).toBe(true);
    });

    it('marca la regla de caracter especial', () => {
      setPassword(INPUT.noSymbol);
      expect(requirementAt(3)).toBe(false);
      setPassword(INPUT.compliant);
      expect(requirementAt(3)).toBe(true);
    });

    it('solo es valido cuando se cumplen las 4 reglas', () => {
      setPassword(INPUT.eightChars);
      expect(page.passwordValid()).toBe(false);
      setPassword(INPUT.compliant);
      expect(page.passwordValid()).toBe(true);
    });
  });

  describe('formValid', () => {
    it('es falso con email invalido y password valido', () => {
      setEmail('not-an-email');
      setPassword(INPUT.compliant);
      expect(page.formValid()).toBe(false);
    });

    it('es falso con email valido y password invalido', () => {
      setEmail(VALID_EMAIL);
      setPassword(INPUT.trivial);
      expect(page.formValid()).toBe(false);
    });

    it('es verdadero cuando ambos campos son validos', () => {
      setEmail(VALID_EMAIL);
      setPassword(INPUT.compliant);
      expect(page.formValid()).toBe(true);
    });
  });

  describe('panel de login', () => {
    const panel = (): Element | null => view.fixture.nativeElement.querySelector('.login-panel');

    it('arranca cerrado', () => {
      expect(page.showLogin).toBe(false);
      expect(panel()?.classList.contains('open')).toBe(false);
    });

    it('se abre al pulsar Log In y se cierra con el boton de volver', async () => {
      view.fixture.nativeElement.querySelector('.btn-login').click();
      view.fixture.detectChanges();
      expect(page.showLogin).toBe(true);
      expect(panel()?.classList.contains('open')).toBe(true);

      view.fixture.nativeElement.querySelector('.back-btn').click();
      view.fixture.detectChanges();
      expect(page.showLogin).toBe(false);
      expect(panel()?.classList.contains('open')).toBe(false);
    });

    it('alterna la visibilidad del password', () => {
      const input = (): Element | null => view.fixture.nativeElement.querySelector('#password');
      expect(input()?.getAttribute('type')).toBe('password');

      view.fixture.nativeElement.querySelector('.toggle-password').click();
      view.fixture.detectChanges();
      expect(input()?.getAttribute('type')).toBe('text');
    });
  });

  describe('isSubmitting', () => {
    it('arranca en falso', () => {
      expect(page.isSubmitting()).toBe(false);
    });

    it('no envia si el formulario es invalido', () => {
      setEmail('not-an-email');
      setPassword(INPUT.compliant);
      page.onLogin();
      expect(page.isSubmitting()).toBe(false);
    });

    it('activa el envio con el formulario valido y marca ambos campos como tocados', () => {
      setEmail(VALID_EMAIL);
      setPassword(INPUT.compliant);
      page.onLogin();
      expect(page.isSubmitting()).toBe(true);
      expect(page.emailTouched()).toBe(true);
      expect(page.passwordTouched()).toBe(true);
    });

    it('ignora un segundo envio mientras el primero sigue en curso', () => {
      setEmail(VALID_EMAIL);
      setPassword(INPUT.compliant);
      page.onLogin();
      page.emailTouched.set(false);

      page.onLogin();

      expect(page.emailTouched()).toBe(false);
    });

    it('deshabilita el boton de submit mientras se envia', () => {
      setEmail(VALID_EMAIL);
      setPassword(INPUT.compliant);
      page.onLogin();
      view.fixture.detectChanges();

      const submit = view.fixture.nativeElement.querySelector('.btn-submit');
      expect(submit.disabled).toBe(true);
    });
  });

  describe('navegacion', () => {
    it('va a forgot-password', () => {
      const router = view.fixture.debugElement.injector.get(Router);
      const navigate = jest.spyOn(router, 'navigate').mockResolvedValue(true);

      page.goToForgotPassword();

      expect(navigate).toHaveBeenCalledWith(['/forgot-password']);
    });
  });

  describe('marcadores de campo tocado', () => {
    it('markEmailTouched y markPasswordTouched activan sus signals', () => {
      expect(page.emailTouched()).toBe(false);
      expect(page.passwordTouched()).toBe(false);

      page.markEmailTouched();
      page.markPasswordTouched();

      expect(page.emailTouched()).toBe(true);
      expect(page.passwordTouched()).toBe(true);
    });
  });
});
