 var currentTab = 0;
    $(function () {
        $("#tabs, .tabs").tabs({
            select: function (e, i) {
                currentTab = i.index;
            }
        });
    });
    $("#btnNext").live("click", function () {
        var tabs = $('#tabs, .tabs').tabs();
        var c = $('#tabs, .tabs').tabs("length");
        currentTab = currentTab == (c - 1) ? currentTab : (currentTab + 1);
        tabs.tabs('select', currentTab);
        $("#btnPrevious").show();
        if (currentTab == (c - 1)) {
            $("#btnNext").hide();
        } else {
            $("#btnNext").show();
        }
    });
    $("#btnPrevious").live("click", function () {
        var tabs = $('#tabs, .tabs').tabs();
        var c = $('#tabs, .tabs').tabs("length");
        currentTab = currentTab == 0 ? currentTab : (currentTab - 1);
        tabs.tabs('select', currentTab);
        if (currentTab == 0) {
            $("#btnNext").show();
            $("#btnPrevious").hide();
        }
        if (currentTab < (c - 1)) {
            $("#btnNext").show();
        }
    });

	



$( document ).ready(function() {
    $('.menuOpen').click(function(){
    $('.menu, .map, .bcome_driver').toggle();
});

if ($(window).width() < 767) {
    $('.menuOpen').click(function(){
    $('.menu2').toggleClass('dis_block');
});
}
});


	

jQuery(document).ready(function($) {
	 
	  $('.nonloop').owlCarousel({
		nav:true,
		center: false,
		dots: true,
		items:2,
		loop: false,
		 slideBy: 2,	
		responsive: {
		 0: {
				items: 1,
			  },
		 600: {
				items: 2,
			  },
		 1024: {
			items: 3
		  }
		 
		}
	  });
	});

  $(function() {
	var Accordion = function(el, multiple) {
		this.el = el || {};
		this.multiple = multiple || false;

		// Variables privadas
		var links = this.el.find('.link');
		// Evento
		links.on('click', {el: this.el, multiple: this.multiple}, this.dropdown)
	}

	Accordion.prototype.dropdown = function(e) {
		var $el = e.data.el;
			$this = $(this),
			$next = $this.next();

		$next.slideToggle();
		$this.parent().toggleClass('open2');

		if (!e.data.multiple) {
			$el.find('.submenu').not($next).slideUp().parent().removeClass('open2');
		};
	}	

	var accordion = new Accordion($('.accordion'), false);
});


