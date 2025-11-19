import { Router } from 'express';
import passport from 'passport';
import { authController } from '../controllers/auth.controller';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  (_req, res) => {
    res.redirect(process.env.GOOGLE_SUCCESS_REDIRECT ?? '/');
  }
);

export default router;

