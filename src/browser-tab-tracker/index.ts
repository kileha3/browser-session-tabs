import { StorageService } from '../storage-service';

const DEFAULT_STORAGE_KEY = 'browser-session-info';
const REGEX_EMPTY_STRING = /^\s*$/;

const INVALID_STORAGE_KEY_ERROR = 'Invalid storage key';
const SESSION_ID_GENERATOR_NOT_SET_ERROR = 'Session ID generator not set';

export interface SessionInfo<T> {
  id: T;
  tab: number;
}

export type SessionIdGenerator<T> = () => T;

export type SessionStartedCallback<T> = (sessionId: T, tabId: number) => void;

export type NewTabOpenedCallback<T> = (tabId: number) => void;

export class BrowserTabTracker<T> {
  private storageKeyName: string = DEFAULT_STORAGE_KEY;

  private sessionInfo: SessionInfo<T> = null as any;

  private sessionIdGenerator: SessionIdGenerator<T> = null as any;

  private sessionStartedCallback?: SessionStartedCallback<T> = null as any;

  private newTabOpenedCallback?: NewTabOpenedCallback<T> = null as any;

  private newSessionCreated = false;

  constructor(private storageService: StorageService) {}

  /**
   * The current tab ID.
   * The tab ID starts from 1, and increments for every tab opened in the session.
   * @returns a number
   */
  get tabId(): number {
    return this.sessionInfo.tab;
  }

  /**
   * The current session ID.
   * The session ID is shared across multiple browser tabs for a given session.
   * @returns a value returned by the SessionIdGenerator
   */
  get sessionId(): T {
    return this.sessionInfo.id;
  }

  /**
   * The name used for the `session storage` item and `cookie`
   */
  get storageKey(): string {
    return this.storageKeyName;
  }

  /**
   * This should be called only after the following`sessionIdGenerator` and `storageKey` are set.
   */
  public initialize(options: {
    sessionIdGenerator: SessionIdGenerator<T>;
    sessionStartedCallback?: SessionStartedCallback<T>;
    newTabOpenedCallback?: NewTabOpenedCallback<T>;
    storageKey?: string;
  }): void {
    if (!this.sessionInfo) {
      // set options
      this.validateSessionIdGenerator(options.sessionIdGenerator);
      this.sessionIdGenerator = options.sessionIdGenerator;
      this.sessionStartedCallback = options.sessionStartedCallback;
      this.newTabOpenedCallback = options.newTabOpenedCallback;
      if (options.storageKey) {
        this.validateKey(options.storageKey);
        this.storageKeyName = options.storageKey;
      }

      // fill in session info
      this.sessionInfo = this.generateSessionInfo();

      // new session? then trigger the callback
      if (this.newSessionCreated && this.sessionStartedCallback) {
        this.sessionStartedCallback(this.sessionId, this.tabId);
      }
    }
    this.listenOnTabCloseEvent();
  }

  private generateSessionInfo(): SessionInfo<T> {
    // if the page has been refreshed in the same tab,
    // we expect the info to be in session storage already
    let sessionInfo = this.storageService.sessionStorageGet<SessionInfo<T>>(this.storageKeyName) as SessionInfo<T>;

    // first time ever on this browser tab?
    // we expect the session storage to not have the info
    if (!sessionInfo) {
      sessionInfo = this.generateNewTabId();
    }

    return sessionInfo;
  }

  private listenOnTabCloseEvent(): void {
    window.onbeforeunload = () => {
      let sessionInfo = this.storageService.sessionStorageGet<SessionInfo<T>>(this.storageKeyName) as SessionInfo<T>;
      sessionInfo.tab = sessionInfo.tab - 1;
      // save cookie, to be shared amongst other tabs in the same session
      this.storageService.sessionCookieSet(this.storageKeyName, sessionInfo);
      // save in session storage, just so it can be accessed within this tab
      this.storageService.sessionStorageSet(this.storageKeyName, sessionInfo);
    };
  }

  private generateNewTabId(): SessionInfo<T> {
    // check if there's already a session in a different tab
    let sessionInfo = this.storageService.sessionCookieGet<SessionInfo<T>>(this.storageKeyName) as SessionInfo<T>;
    if (!sessionInfo) {
      sessionInfo = this.startNewSession();
    }
    sessionInfo.tab = sessionInfo.tab + 1; // increase count
    if (this.newTabOpenedCallback) {
      this.newTabOpenedCallback(sessionInfo.tab);
    }

    // save cookie, to be shared amongst other tabs in the same session
    this.storageService.sessionCookieSet(this.storageKeyName, sessionInfo);
    // save in session storage, just so it can be accessed within this tab
    this.storageService.sessionStorageSet(this.storageKeyName, sessionInfo);

    return sessionInfo;
  }

  private validateKey(key: string): void {
    if (!key || REGEX_EMPTY_STRING.test(key)) {
      throw new Error(INVALID_STORAGE_KEY_ERROR);
    }
  }

  private startNewSession(): SessionInfo<T> {
    this.newSessionCreated = true;
    return {
      id: this.sessionIdGenerator(),
      tab: 0
    };
  }

  private validateSessionIdGenerator(generator: SessionStartedCallback<T>): void {
    if (!generator) {
      throw new Error(SESSION_ID_GENERATOR_NOT_SET_ERROR);
    }
  }
}
