import { Router } from 'express';
import authRoute from './app/modules/auth/auth.route';
import vocabularyRoute from './app/modules/vocabulary/vocabulary.route';
import progressRoute from './app/modules/progress/progress.route';


const appRouter = Router();

const moduleRoutes = [
    { path: '/auth', route: authRoute },
    { path: '/vocabulary', route: vocabularyRoute },
    { path: '/progress', route: progressRoute },
];

moduleRoutes.forEach(route => appRouter.use(route.path, route.route));
export default appRouter;
