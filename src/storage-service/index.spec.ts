import { get as CookiesGet, set as CookiesSet } from 'js-cookie';

import { StorageService } from './index';

jest.mock('js-cookie');

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(() => {
    service = new StorageService();
  });

  describe('session storage', () => {
    describe('sessionStorageSet()', () => {
      beforeEach(() => {
        spyOn(window.sessionStorage.__proto__, 'setItem');
      });

      it('should set value in session storage', () => {
        service.sessionStorageSet('my-key', 'my-value');

        // session storage is called
        expect(window.sessionStorage.setItem).toHaveBeenCalled();
        // value is stringified
        expect(window.sessionStorage.setItem).toHaveBeenCalledWith('my-key', '"my-value"');
      });

      it('should stringify object to json', () => {
        service.sessionStorageSet('my-key', { foo: 'bar' });

        const stringifiedJson = JSON.stringify({ foo: 'bar' });
        expect(window.sessionStorage.setItem).toHaveBeenCalledWith('my-key', stringifiedJson);
      });
    });

    describe('sessionStorageGet()', () => {
      let mockSessionStorageGetReturn: any;

      beforeEach(() => {
        mockSessionStorageGetReturn = null;
        spyOn(window.sessionStorage.__proto__, 'getItem').and.callFake(() => mockSessionStorageGetReturn);
      });

      it('should return value from session storage', () => {
        mockSessionStorageGetReturn = JSON.stringify('foo');

        const result = service.sessionStorageGet('my-key');

        // session storage is called
        expect(window.sessionStorage.getItem).toHaveBeenCalled();
        expect(window.sessionStorage.getItem).toHaveBeenCalledWith('my-key');

        // session storage value is returned
        expect(result).toEqual('foo');
      });

      it('should parse json object', () => {
        mockSessionStorageGetReturn = JSON.stringify({ bar: 'foo' });

        const result = service.sessionStorageGet('my-key');

        // parsed value is returned
        expect(result).toEqual({ bar: 'foo' });
      });

      it('should return null if item not in session storage', () => {
        // item not found, `sessionStorage.getItem() => null`
        mockSessionStorageGetReturn = null;

        const result = service.sessionStorageGet('my-key');
        expect(result).toBeNull();
      });

      it('should return provided default value if item not in session storage', () => {
        // item not found, `sessionStorage.getItem() => null`
        mockSessionStorageGetReturn = null;

        const defautlValue = { foo: 'my-default' };
        const result = service.sessionStorageGet('my-key', defautlValue);
        expect(result).toBe(defautlValue);
      });

      it('should return null if item in session storage is not valid', () => {
        // item is invalid if it's not a valid json string
        mockSessionStorageGetReturn = 'foo: bar'; // not a valid json

        const result = service.sessionStorageGet('my-key');
        expect(result).toBeNull();
      });
    });
  });

  describe('session cookie', () => {
    beforeEach(() => {
      // get.mockClear();
    });

    describe('sessionCookieSet()', () => {
      it('should set value in session cookie', () => {
        service.sessionCookieSet('my-key', 'my-value');

        // session storage is called
        expect(CookiesSet).toHaveBeenCalled();
        // value is stringified
        expect(CookiesSet).toHaveBeenCalledWith('my-key', '"my-value"');
      });

      it('should stringify object to json', () => {
        service.sessionCookieSet('my-key', { foo: 'bar' });

        const stringifiedJson = JSON.stringify({ foo: 'bar' });
        expect(CookiesSet).toHaveBeenCalledWith('my-key', stringifiedJson);
      });
    });

    describe('sessionStorageGet()', () => {
      let mockCookieValue: any;

      beforeEach(() => {
        mockCookieValue = undefined;
        (CookiesGet as any).and.callFake(() => mockCookieValue);
      });

      fit('should return value from session storage', () => {
        mockCookieValue = JSON.stringify('foo');

        const result = service.sessionCookieGet('my-key');

        // session cookie is called
        expect(CookiesGet).toHaveBeenCalled();
        expect(CookiesGet).toHaveBeenCalledWith('my-key');

        // session cookie value is returned
        expect(result).toEqual('foo');
      });

      it('should parse json object', () => {
        mockCookieValue = JSON.stringify({ bar: 'foo' });

        const result = service.sessionCookieGet('my-key');

        // parsed value is returned
        expect(result).toEqual({ bar: 'foo' });
      });

      it('should return null if item not in session storage', () => {
        // item not found, `Cookies.get() => undefined`
        mockCookieValue = null;

        const result = service.sessionCookieGet('my-key');
        expect(result).toBeNull();
      });

      it('should return provided default value if item not in session storage', () => {
        // item not found, `Cookies.get() => undefined`
        mockCookieValue = null;

        const defautlValue = { foo: 'my-default' };
        const result = service.sessionCookieGet('my-key', defautlValue);
        expect(result).toBe(defautlValue);
      });

      it('should return null if item in session storage is not valid', () => {
        // item is invalid if it's not a valid json string
        mockCookieValue = 'foo: bar'; // not a valid json

        const result = service.sessionCookieGet('my-key');
        expect(result).toBeNull();
      });
    });
  });

});