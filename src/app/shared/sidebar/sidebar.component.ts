import { Component, OnInit } from '@angular/core';
import PerfectScrollbar from 'perfect-scrollbar';

declare const $: any;

//Metadata
export interface RouteInfo {
    path: string;
    title: string;
    type: string;
    icontype: string;
    collapse?: string;
    children?: ChildrenItems[];
}

export interface ChildrenItems {
    path: string;
    title: string;
    ab: string;
    type?: string;
}

//Menu Items
export const ROUTES: RouteInfo[] = [{
    path: '/',
    title: 'Reserva',
    type: 'link',
    icontype: 'dashboard'
}, {
    path: '/categorias',
    title: 'Categorías',
    type: 'link',
    icontype: 'bookmark'
},
{
    path: '/subcategorias',
    title: 'Subcategorías',
    type: 'link',
    icontype: 'bookmarks'
},
{
    path: '/presentacion',
    title: 'Presentación',
    type: 'link',
    icontype: 'branding_watermark'
},
{
    path: '/paciente',
    title: 'Paciente',
    icontype: 'dashboard',
    type: 'link',
},
{
    path: '/horarios',
    title: 'Horarios',
    type: 'link',
    icontype: 'dashboard',
},
{
    path: '/reservas',
    title: 'Reservas',
    type: 'link',
    icontype: 'dashboard',
},
{
    title: 'Excepciones',
    path: '/excepciones',
    type: 'link',
    icontype: 'dashboard'
},
{

    path: '/servicios',
    type: 'link',
    title: 'Servicios',
    icontype: 'dashboard'
},
{
    path: '/ficha',
    title: 'Ficha Medica',
    type: 'link',
    icontype: 'dashboard'
},
{
    path: '/reportes',
    title: 'Reportes',
    type: 'link',
    icontype: 'insert_chart'
},
];
@Component({
    selector: 'app-sidebar-cmp',
    templateUrl: 'sidebar.component.html',
})

export class SidebarComponent implements OnInit {
    public menuItems: any[];
    public usuario: string;
    ps: any;
    isMobileMenu() {
        if ($(window).width() > 991) {
            return false;
        }
        return true;
    };

    ngOnInit() {
        this.menuItems = ROUTES.filter(menuItem => menuItem);
        this.usuario = localStorage.getItem('currentUser');
        if (window.matchMedia(`(min-width: 960px)`).matches && !this.isMac()) {
            const elemSidebar = <HTMLElement>document.querySelector('.sidebar .sidebar-wrapper');
            this.ps = new PerfectScrollbar(elemSidebar);
        }
    }
    updatePS(): void {
        if (window.matchMedia(`(min-width: 960px)`).matches && !this.isMac()) {
            this.ps.update();
        }
    }
    isMac(): boolean {
        let bool = false;
        if (navigator.platform.toUpperCase().indexOf('MAC') >= 0 || navigator.platform.toUpperCase().indexOf('IPAD') >= 0) {
            bool = true;
        }
        return bool;
    }
}
