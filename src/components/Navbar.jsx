import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { FiBell, FiChevronDown, FiLogOut, FiShoppingCart } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import {
  markAllNotificationsAsRead,
  markNotificationAsRead,
  NOTIFICATIONS_KEY,
  readList,
  subscribeToStore,
} from "../data/commerceStore";
import styles from "../styles/Navbar.module.css";

function LanguageFlag({ language }) {
  return (
    <svg className={styles.languageFlag} viewBox="0 0 24 16" aria-hidden="true">
      {language === "en" ? (
        <>
          <rect width="24" height="16" fill="#012169" />
          <path d="M0 0 24 16M24 0 0 16" stroke="#fff" strokeWidth="4" />
          <path d="M0 0 24 16M24 0 0 16" stroke="#c8102e" strokeWidth="1.5" />
          <path d="M12 0v16M0 8h24" stroke="#fff" strokeWidth="6" />
          <path d="M12 0v16M0 8h24" stroke="#c8102e" strokeWidth="3" />
        </>
      ) : (
        <>
          <rect width="24" height="16" rx="1" fill="#006c35" />
          <text x="12" y="6.5" textAnchor="middle" fill="#fff" fontSize="2.2" direction="rtl">لا إله إلا الله</text>
          <path d="M6 10.5h12" stroke="#fff" strokeWidth="0.8" />
          <path d="M8 12h8" stroke="#fff" strokeWidth="0.7" />
        </>
      )}
    </svg>
  );
}

function Navbar() {
  const cart = useSelector((state) => state.cart.items);
  const { lang, changeLanguage } = useLanguage();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const unreadCount = notifications.filter((notification) => !notification.readAt).length;

  useEffect(() => {
    if (!user?.email) {
      setNotifications([]);
      return undefined;
    }

    const refreshNotifications = () => {
      setNotifications(
        readList(NOTIFICATIONS_KEY).filter(
          (notification) => notification.recipientEmail?.toLowerCase() === user.email.toLowerCase()
        )
      );
    };

    refreshNotifications();
    return subscribeToStore(refreshNotifications);
  }, [user?.email, user?.role]);

  const handleNotificationClick = (notification, event) => {
    markNotificationAsRead(notification.id);
    event.currentTarget.closest("details").open = false;
  };

  return (
    <nav className={styles.navbar}>
      <Link to="/" className={styles.logo}>
        ShopEase
      </Link>

      <div className={styles.links}>
        <Link to="/" className={styles.textLink}>Home</Link>
        <Link to="/products" className={styles.textLink}>Shop</Link>
        {user ? (
          <details className={styles.accountMenu}>
            <summary
              className={styles.profileTrigger}
              aria-label={`Open profile menu for ${user.name}`}
              title="Account menu"
            >
              <span className={styles.avatar} aria-hidden="true">
                {user.name
                  .trim()
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join("")
                  .toUpperCase()}
              </span>
              <FiChevronDown className={styles.profileCaret} aria-hidden="true" />
            </summary>
            <div className={styles.profilePanel}>
              <div className={styles.profileDetails}>
                <span className={styles.profileAvatar} aria-hidden="true">
                  {user.name
                    .trim()
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join("")
                    .toUpperCase()}
                </span>
                <strong className={styles.profileName}>{user.name}</strong>
                <span className={styles.profileEmail}>{user.email}</span>
                <span className={styles.profileRole}>{user.role}</span>
              </div>
              {user.role === "admin" ? (
                <Link
                  className={styles.profileLink}
                  to="/admin"
                  onClick={(event) => { event.currentTarget.closest("details").open = false; }}
                >
                  Admin dashboard
                </Link>
              ) : (
                <Link
                  className={styles.profileLink}
                  to="/customer"
                  onClick={(event) => { event.currentTarget.closest("details").open = false; }}
                >
                  My account
                </Link>
              )}
              <button
                type="button"
                className={styles.logoutButton}
                onClick={(event) => {
                  event.currentTarget.closest("details").open = false;
                  logout();
                  navigate("/");
                }}
              >
                <FiLogOut aria-hidden="true" />
                Logout
              </button>
            </div>
          </details>
        ) : (
          <Link to="/login" className={styles.textLink}>Login</Link>
        )}
        <Link to="/cart" className={styles.iconLink} aria-label={`Cart${totalItems ? `, ${totalItems} items` : ""}`} title="Cart">
          <FiShoppingCart aria-hidden="true" />
          {totalItems > 0 && <span className={styles.badge}>{totalItems}</span>}
        </Link>
        {user && user.role !== "admin" && (
          <details className={styles.notificationMenu}>
            <summary
              className={styles.notificationTrigger}
              aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
              title="Notifications"
            >
              <FiBell aria-hidden="true" />
              {unreadCount > 0 && <span className={styles.notificationBadge}>{unreadCount > 9 ? "9+" : unreadCount}</span>}
            </summary>
            <div className={styles.notificationPanel}>
              <div className={styles.notificationHeading}>
                <strong>Notifications</strong>
                {unreadCount > 0 && (
                  <button type="button" onClick={() => markAllNotificationsAsRead(user.email)}>
                    Mark all as read
                  </button>
                )}
              </div>
              {notifications.length ? (
                <div className={styles.notificationList}>
                  {notifications.slice(0, 8).map((notification) => (
                    <Link
                      key={notification.id}
                      to="/customer"
                      className={`${styles.notificationItem} ${notification.readAt ? "" : styles.notificationUnread}`}
                      onClick={(event) => handleNotificationClick(notification, event)}
                    >
                      <span className={styles.notificationCopy}>
                        <strong>{notification.title}</strong>
                        <span>{notification.message}</span>
                        <time dateTime={notification.createdAt}>
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </time>
                      </span>
                      {!notification.readAt && <span className={styles.unreadDot} aria-label="Unread" />}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className={styles.noNotifications}>You’re all caught up.</p>
              )}
            </div>
          </details>
        )}
        <details className={styles.languageMenu}>
          <summary
            className={styles.languageTrigger}
            aria-label={`Select language. Current: ${lang === "en" ? "English" : "العربية"}`}
            title="Select language"
          >
            <LanguageFlag language={lang} />
            <FiChevronDown className={styles.dropdownCaret} aria-hidden="true" />
          </summary>
          <div className={styles.languageOptions}>
            <button
              type="button"
              className={`${styles.languageOption} ${lang === "en" ? styles.selectedLanguage : ""}`}
              onClick={(event) => {
                changeLanguage("en");
                event.currentTarget.closest("details").open = false;
              }}
            >
              <LanguageFlag language="en" />
              English
            </button>
            <button
              type="button"
              className={`${styles.languageOption} ${lang === "ar" ? styles.selectedLanguage : ""}`}
              onClick={(event) => {
                changeLanguage("ar");
                event.currentTarget.closest("details").open = false;
              }}
            >
              <LanguageFlag language="ar" />
              العربية
            </button>
          </div>
        </details>
      </div>
    </nav>
  );
}

export default Navbar;